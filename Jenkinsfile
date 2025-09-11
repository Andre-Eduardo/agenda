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
        npm_config_cache = 'npm-cache'
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
                withCredentials([string(credentialsId: 'devops-nexus', variable: 'TOKEN')]) {
                    sh '''
                        echo "@ecxus:registry=http://ecxus.ddns.net:8081/repository/npm-private/" >> ~/.npmrc
                        echo "//ecxus.ddns.net:8081/repository/npm-private/:_auth=$TOKEN" >> ~/.npmrc

                        pnpm install

                        rm -rf ~/.npmrc
                    '''
                }
            }
        }

        stage('Validate') {
            failFast true
            parallel {
                stage('Type check') {
                    steps {
                        sh label: 'Type check', script: 'pnpm -F @automo/server typecheck'
                    }
                }

                stage('Lint') {
                    steps {
                        sh label: 'Lint', script: 'pnpm run lint'
                    }
                }

                stage('Unit tests') {
                    steps {
                        sh label: 'Unit tests', script: 'pnpm -F @automo/server test'
                    }
                }

                stage('Integration tests') {
                    steps {
                        script {
                            sh label: 'Create the database Docker container', script: """
                                docker run -d --name $POSTGRES_CONTAINER \\
                                    -e POSTGRES_PASSWORD=postgres \\
                                    --network=jenkins \\
                                    postgres:16-alpine \\
                                    -c fsync=off -c synchronous_commit=off -c full_page_writes=off
                            """
                        }
                        withEnv(["DATABASE_HOST=${env.POSTGRES_CONTAINER}"]) {
                            sh label: 'Integration tests', script: 'pnpm -F @automo/server test:integration'
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
