pipeline {
    agent {
        dockerfile {
            label 'agent_docker'
            filename 'Dockerfile.build'
            dir '.'
            args '-v /var/run/docker.sock:/var/run/docker.sock --net="jenkins"'
        }
    }

    environment {
        HOME = '.'
        CI = 'true'
        BUILD_TAG = getNormalizedBuildTag()
        POSTGRES_CONTAINER = "postgres-${BUILD_TAG}"
    }

    stages {
        stage('Tool check') {
            steps {
                sh label: 'PNPM check', script: 'pnpm -v'
                sh label: 'Docker Check', script: 'docker --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                // All dependencies are public (npmjs.org); no private registry credentials are needed.
                sh label: 'Install', script: 'pnpm install --frozen-lockfile'
            }
        }

        stage('Validate') {
            failFast true
            parallel {
                stage('Type check') {
                    steps {
                        sh label: 'Type check', script: 'pnpm run typecheck'
                    }
                }

                stage('Lint') {
                    steps {
                        sh label: 'Lint', script: 'pnpm run lint'
                    }
                }

                stage('Unit tests') {
                    steps {
                        sh label: 'Unit tests', script: 'pnpm -F @agenda-app/server test'
                        sh label: 'Backup scripts tests', script: 'node --test ops/backup/agenda-backup.test.mjs ops/backup/scheduler.test.mjs'
                    }
                }

                stage('Integration tests') {
                    steps {
                        script {
                            sh label: 'Create the database Docker container', script: """
                                docker run -d --name $POSTGRES_CONTAINER \\
                                    -e POSTGRES_PASSWORD=postgres \\
                                    --network=jenkins \\
                                    pgvector/pgvector:pg16 \\
                                    -c fsync=off -c synchronous_commit=off -c full_page_writes=off
                            """
                        }
                        withEnv(["DATABASE_HOST=${env.POSTGRES_CONTAINER}"]) {
                            sh label: 'Integration tests', script: 'pnpm -F @agenda-app/server test:integration'
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh label: 'Build', script: 'pnpm run build'
            }
        }

        stage('Docker images') {
            when {
                branch 'master'
            }
            steps {
                sh label: 'Server image', script: 'docker build -f apps/server/Dockerfile -t agenda/server:${GIT_COMMIT} .'
                sh label: 'Web image', script: 'docker build -f apps/web/Dockerfile -t agenda/web:${GIT_COMMIT} .'
                sh label: 'Backup image', script: 'docker build -f ops/backup/Dockerfile -t agenda/backup:${GIT_COMMIT} .'
            }
        }
    }

    post {
        always {
            sh label: 'Cleanup', script: 'docker rm -f $POSTGRES_CONTAINER || true'
        }
    }
}

def getNormalizedBuildTag() {
    return URLDecoder.decode(env.BUILD_TAG).replaceAll(/\W/, '_')
}
