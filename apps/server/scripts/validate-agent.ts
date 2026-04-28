#!/usr/bin/env ts-node
/**
 * Agent validation script.
 *
 * Runs a set of questions against the agent endpoint and checks if the response
 * contains expected keywords. Exits with code 1 if pass rate < 80%.
 *
 * Usage:
 *   pnpm -F @agenda-app/server validate:agent
 *   pnpm -F @agenda-app/server validate:agent --base-url=http://localhost:3000 --session-token=<cookie>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import {URL} from 'url';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
    id: string;
    question: string;
    expectedKeywords: string[];
    expectedTools?: string[];
    category: string;
    note?: string;
};

type AgentResponse = {
    answer: string;
    toolCalls: Array<{tool: string}>;
    proposalIds: string[];
    totalIterations: number;
    finishReason: string;
};

type Result = {
    id: string;
    category: string;
    question: string;
    passed: boolean;
    answer: string;
    matchedKeywords: string[];
    missedKeywords: string[];
    toolsUsed: string[];
    durationMs: number;
    error?: string;
};

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

const getArg = (name: string, fallback: string) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));

    return found ? found.split('=').slice(1).join('=') : fallback;
};

const BASE_URL = getArg('base-url', 'http://localhost:3000');
const SESSION_TOKEN = getArg('session-token', process.env['SESSION_TOKEN'] ?? '');
const MIN_PASS_RATE = parseFloat(getArg('min-pass-rate', '0.8'));
const CATEGORY_FILTER = getArg('category', '');

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function post(url: string, body: unknown, cookieHeader: string): Promise<{status: number; body: unknown}> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const data = JSON.stringify(body);

        const req = lib.request(
            {
                hostname: parsed.hostname,
                port: parsed.port,
                path: parsed.pathname + parsed.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    ...(cookieHeader ? {Cookie: cookieHeader} : {}),
                },
            },
            (res) => {
                let raw = '';

                res.on('data', (chunk: Buffer) => (raw += chunk));
                res.on('end', () => {
                    try {
                        resolve({status: res.statusCode ?? 0, body: JSON.parse(raw)});
                    } catch {
                        resolve({status: res.statusCode ?? 0, body: raw});
                    }
                });
            },
        );

        req.on('error', reject);
        req.setTimeout(30_000, () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
        req.write(data);
        req.end();
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const questionsPath = path.join(__dirname, '../docs/agent-validation-questions.json');

    if (!fs.existsSync(questionsPath)) {
        console.error(`Questions file not found: ${questionsPath}`);
        process.exit(1);
    }

    const allQuestions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    const questions = CATEGORY_FILTER
        ? allQuestions.filter((q) => q.category === CATEGORY_FILTER)
        : allQuestions;

    if (!SESSION_TOKEN) {
        console.error(
            'No session token provided. Set --session-token=<value> or SESSION_TOKEN env var.\n' +
            'Get a token by signing in and copying the session cookie.',
        );
        process.exit(1);
    }

    console.log(`\n🤖 Agent Validation — ${questions.length} questions (${BASE_URL})\n`);
    console.log('─'.repeat(70));

    const results: Result[] = [];
    let passed = 0;

    for (const q of questions) {
        const start = Date.now();
        let result: Result;

        try {
            const response = await post(
                `${BASE_URL}/api/v1/agent/ask`,
                {message: q.question},
                SESSION_TOKEN,
            );

            const durationMs = Date.now() - start;
            const agentRes = response.body as AgentResponse;
            const answer = agentRes?.answer ?? '';
            const toolsUsed = (agentRes?.toolCalls ?? []).map((tc) => tc.tool);

            const answerLower = answer.toLowerCase();
            const matchedKeywords = q.expectedKeywords.filter((kw) =>
                answerLower.includes(kw.toLowerCase()),
            );
            const missedKeywords = q.expectedKeywords.filter(
                (kw) => !answerLower.includes(kw.toLowerCase()),
            );

            const keywordPass = matchedKeywords.length >= Math.ceil(q.expectedKeywords.length * 0.6);
            const httpPass = response.status >= 200 && response.status < 300;
            const questionPassed = httpPass && (q.expectedKeywords.length === 0 || keywordPass);

            if (questionPassed) passed++;

            result = {
                id: q.id,
                category: q.category,
                question: q.question,
                passed: questionPassed,
                answer: answer.slice(0, 120) + (answer.length > 120 ? '...' : ''),
                matchedKeywords,
                missedKeywords,
                toolsUsed,
                durationMs,
            };
        } catch (error) {
            const durationMs = Date.now() - start;
            result = {
                id: q.id,
                category: q.category,
                question: q.question,
                passed: false,
                answer: '',
                matchedKeywords: [],
                missedKeywords: q.expectedKeywords,
                toolsUsed: [],
                durationMs,
                error: error instanceof Error ? error.message : String(error),
            };
        }

        const icon = result.passed ? '✅' : '❌';
        const duration = `${result.durationMs}ms`.padStart(7);
        const tools = result.toolsUsed.length > 0 ? ` [${result.toolsUsed.join(', ')}]` : '';

        console.log(`${icon} [${result.category.padEnd(10)}] ${q.id.padEnd(14)} ${duration}${tools}`);

        if (!result.passed) {
            if (result.error) console.log(`   Error: ${result.error}`);
            else if (result.missedKeywords.length > 0)
                console.log(`   Missing keywords: ${result.missedKeywords.join(', ')}`);
            console.log(`   Answer: ${result.answer || '(empty)'}`);
        }

        results.push(result);
    }

    const total = questions.length;
    const passRate = passed / total;
    const avgDuration = Math.round(results.reduce((sum, r) => sum + r.durationMs, 0) / total);

    console.log('\n' + '─'.repeat(70));
    console.log(`\nResults: ${passed}/${total} passed (${Math.round(passRate * 100)}%) — avg ${avgDuration}ms/question`);

    const byCategory: Record<string, {passed: number; total: number}> = {};

    for (const r of results) {
        byCategory[r.category] ??= {passed: 0, total: 0};
        byCategory[r.category].total++;

        if (r.passed) byCategory[r.category].passed++;
    }

    console.log('\nBy category:');

    for (const [cat, stats] of Object.entries(byCategory)) {
        const icon = stats.passed === stats.total ? '✅' : '⚠️';

        console.log(`  ${icon} ${cat.padEnd(12)} ${stats.passed}/${stats.total}`);
    }

    if (passRate < MIN_PASS_RATE) {
        console.log(`\n❌ Pass rate ${Math.round(passRate * 100)}% < required ${Math.round(MIN_PASS_RATE * 100)}%`);
        process.exit(1);
    } else {
        console.log(`\n✅ Pass rate ${Math.round(passRate * 100)}% >= required ${Math.round(MIN_PASS_RATE * 100)}%`);
    }
}

main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
