def services = [
    'media-service',
    'user-service',
    'product-service',
    'api-gateway',
    'eureka',
    'audit-service',
    'order-service',
    'cart-service'
]

def rollbackDeployment() {
    if (!params.ROLLBACK_ON_FAILURE) {
        echo 'Rollback is disabled.'
        error(
            'Deployment verification failed and rollback is disabled.'
        )
    }

    def previousBuild = currentBuild.previousSuccessfulBuild

    if (previousBuild == null) {
        error('No previous successful build exists for rollback.')
    }

    def previousVersion = "1.0.${previousBuild.number}"

    echo "Rolling back to ${previousVersion}..."

    sh """
        IMAGE_TAG='${previousVersion}' docker compose \
            -f docker-compose.jenkins.yml \
            up -d --no-build
    """

    echo "Rollback to ${previousVersion} completed."
    error(
        'Deployment failed. ' +
        "Application rolled back to ${previousVersion}."
    )
}

pipeline {
    agent none

    options {
        skipDefaultCheckout(true)
    }

    triggers {
        cron('H 2 * * *')
    }

    parameters {
        choice(
            name: 'TEST_SCOPE',
            choices: ['all', 'backend', 'frontend', 'none'],
            description: 'Select which tests to run'
        )

        booleanParam(
            name: 'ROLLBACK_ON_FAILURE',
            defaultValue: true,
            description: 'Automatically rollback if deployment verification fails'
        )

        booleanParam(
            name: 'SEND_NOTIFICATIONS',
            defaultValue: true,
            description: 'Send email notifications for build results'
        )

        booleanParam(
            name: 'DEPLOY',
            defaultValue: false,
            description: 'Deploy the application and run E2E verification'
        )
    }

    environment {
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        NOTIFICATION_EMAIL = 'amine.yacoubi.med@gmail.com'

        JWT_SECRET = credentials('JWT_SECRET')
        GATEWAY_KEYSTORE_PASSWORD = credentials('GATEWAY_KEYSTORE_PASSWORD')
        MINIO_ROOT_USER = credentials('MINIO_ROOT_USER')
        MINIO_ROOT_PASSWORD = credentials('MINIO_ROOT_PASSWORD')
        MONGO_ROOT_USERNAME = credentials('MONGO_ROOT_USERNAME')
        MONGO_ROOT_PASSWORD = credentials('MONGO_ROOT_PASSWORD')
        ADMIN_NAME = credentials('ADMIN_NAME')
        ADMIN_EMAIL = credentials('ADMIN_EMAIL')
        ADMIN_PASSWORD = credentials('ADMIN_PASSWORD')
    }

    stages {
        stage('Checkout Source') {
            agent {
                label 'backend'
            }

            steps {
                checkout scm

                stash(
                    name: 'source',
                    includes: '**'
                )
            }
        }

        stage('Backend CI') {
            agent {
                label 'backend'
            }

            stages {
                stage('Checkout') {
                    steps {
                        deleteDir()
                        unstash 'source'
                    }
                }

                stage('Diagnose Nexus Connectivity') {
                    steps {
                        sh '''
                            echo "=== Agent identity ==="
                            hostname
                            id

                            echo "=== Nexus DNS ==="
                            getent hosts nexus || true

                            echo "=== Nexus endpoints ==="
                            curl -sS -o /dev/null -w "nexus:8081 -> HTTP %{http_code}\\n" \
                                --connect-timeout 5 \
                                http://nexus:8081/service/rest/v1/status || true

                            curl -sS -o /dev/null -w "localhost:8081 -> HTTP %{http_code}\\n" \
                                --connect-timeout 5 \
                                http://localhost:8081/service/rest/v1/status || true
                        '''
                    }
                }

                stage('Configure Nexus Maven') {
                    steps {
                        withCredentials([
                           usernamePassword(
                                credentialsId: 'nexus-docker-credentials',
                                usernameVariable: 'NEXUS_USERNAME',
                                passwordVariable: 'NEXUS_PASSWORD'
                            )
                        ]) {
                            sh(
                                script: """
                                    set +x
                                    cat > .maven-settings.xml <<EOF
                            <settings>
                                <servers>
                                    <server>
                                        <id>nexus-maven</id>
                                        <username>\${NEXUS_USERNAME}</username>
                                        <password>\${NEXUS_PASSWORD}</password>
                                    </server>
                                    <server>
                                        <id>nexus-snapshots</id>
                                        <username>\${NEXUS_USERNAME}</username>
                                        <password>\${NEXUS_PASSWORD}</password>
                                    </server>
                                    <server>
                                        <id>nexus-releases</id>
                                        <username>\${NEXUS_USERNAME}</username>
                                        <password>\${NEXUS_PASSWORD}</password>
                                    </server>
                                </servers>
                                <mirrors>
                                    <mirror>
                                        <id>nexus-maven</id>
                                        <mirrorOf>*</mirrorOf>
                                        <url>http://localhost:8081/repository/maven-public/</url>
                                    </mirror>
                                </mirrors>
                            </settings>
                            EOF
                                """.stripIndent()
                            )
                            stash(
                name: 'maven-settings',
                includes: '.maven-settings.xml'
            )
                        }
                    }
                }

                stage('Build') {
                    steps {
                        withCredentials([
                                usernamePassword(
                                    credentialsId: 'nexus-docker-credentials',
                                    usernameVariable: 'NEXUS_USERNAME',
                                    passwordVariable: 'NEXUS_PASSWORD'
                                )
                            ]) {
                            script {
                                def builds = [:]

                                services.each { service ->
                                    def currentService = service

                                    builds[currentService] = {
                                        dir("backend/${currentService}") {
                                            unstash 'maven-settings'

                                            sh '''
                                            ./mvnw -B \
                                                -s .maven-settings.xml \
                                                package -DskipTests
                                        '''
                                        }
                                    }
                                }

                                parallel builds
                            }
                            }
                    }
                }

                stage('Test') {
                    when {
                        expression {
                            params.TEST_SCOPE == 'all' ||
                            params.TEST_SCOPE == 'backend'
                        }
                    }

                    steps {
                        withCredentials([
                                usernamePassword(
                                    credentialsId: 'nexus-docker-credentials',
                                    usernameVariable: 'NEXUS_USERNAME',
                                    passwordVariable: 'NEXUS_PASSWORD'
                                )
                            ]) {
                            script {
                                def tests = [:]

                                services.each { service ->
                                    def currentService = service

                                    tests[currentService] = {
                                        dir("backend/${currentService}") {
                                            unstash 'maven-settings'

                                            sh '''
                                            ./mvnw -B \
                                                -s .maven-settings.xml \
                                                verify
                                        '''
                                        }
                                    }
                                }

                                parallel tests
                            }
                            }
                    }

                    post {
                        always {
                            junit 'backend/**/target/surefire-reports/*.xml'
                        }
                    }
                }

                stage('Publish Maven Artifacts') {
                    steps {
                        withCredentials([
                                usernamePassword(
                                    credentialsId: 'nexus-docker-credentials',
                                    usernameVariable: 'NEXUS_USERNAME',
                                    passwordVariable: 'NEXUS_PASSWORD'
                                )
                            ]) {
                            script {
                                def deployments = [:]

                                services.each { service ->
                                    def currentService = service

                                    deployments[currentService] = {
                                        dir("backend/${currentService}") {
                                            unstash 'maven-settings'

                                            sh '''
                                ./mvnw -B \
                                    -s .maven-settings.xml \
                                    deploy -DskipTests
                            '''
                                        }
                                    }
                                }

                                parallel deployments
                            }
                            }
                    }
                }

                stage('Stash Backend Artifacts') {
                    steps {
                        stash(
                            name: 'backend-artifacts',
                            includes: 'backend/**/target/classes/**/*.class,backend/**/target/site/jacoco/jacoco.xml',
                            allowEmpty: true
                        )
                    }
                }
            }
        }

        stage('Frontend CI') {
            agent {
                label 'frontend'
            }

            stages {
                stage('Checkout') {
                    steps {
                        deleteDir()
                        unstash 'source'
                    }
                }

                stage('Build') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }

                stage('Test') {
                    when {
                        expression {
                            params.TEST_SCOPE == 'all' ||
                            params.TEST_SCOPE == 'frontend'
                        }
                    }

                    steps {
                        dir('frontend') {
                            sh 'npm test'
                        }
                    }

                    post {
                        always {
                            junit 'frontend/test-reports/reports.xml'
                        }
                    }
                }

                stage('Stash Frontend Coverage') {
                    steps {
                        stash(
                            name: 'frontend-coverage',
                            includes: 'frontend/coverage/lcov.info',
                            allowEmpty: true
                        )
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            agent {
                label 'backend'
            }

            steps {
                deleteDir()

                unstash 'source'
                unstash 'backend-artifacts'

                script {
                    if (
                        params.TEST_SCOPE == 'all' ||
                        params.TEST_SCOPE == 'frontend'
                    ) {
                        unstash 'frontend-coverage'
                    }

                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.host.url=http://localhost:9000
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate(
                        abortPipeline: true,
                    )
                }
            }
        }

        stage('Build & Push Docker Images') {
            when {
                allOf {
                    expression { params.DEPLOY }
                    not {
                        triggeredBy 'TimerTrigger'
                    }
                }
            }

            agent {
                label 'deployment'
            }

            steps {
                deleteDir()
                unstash 'source'

                withCredentials([
            usernamePassword(
                credentialsId: 'nexus-docker-credentials',
                usernameVariable: 'NEXUS_USERNAME',
                passwordVariable: 'NEXUS_PASSWORD'
            ),
            file(
                credentialsId: 'TLS_KEY',
                variable: 'TLS_KEY'
            ),
            file(
                credentialsId: 'TLS_CRT',
                variable: 'TLS_CRT'
            ),
            file(
                credentialsId: 'GATEWAY_KEYSTORE',
                variable: 'KEYSTORE_FILE'
            )
        ]) {
                    sh '''
                set -eu

                mkdir -p frontend/certs

                cp "$TLS_KEY" frontend/certs/frontend.key
                cp "$TLS_CRT" frontend/certs/frontend.crt

                cp "$KEYSTORE_FILE" \
                    backend/api-gateway/src/main/resources/gateway-keystore.p12

                printf '%s' "$NEXUS_PASSWORD" |
                    docker login localhost:18080 \
                        --username "$NEXUS_USERNAME" \
                        --password-stdin
            '''

                    script {
                        services.each { service ->
                            def image =
                        "localhost:18080/buy-02/${service}:${IMAGE_TAG}"

                            sh """
                        set -eu
                        docker build -t '${image}' 'backend/${service}'
                        docker push '${image}'
                    """
                        }
                    }

                    sh """
                set -eu
                docker build \
                    -t 'localhost:18080/buy-02/frontend:${IMAGE_TAG}' \
                    ./frontend

                docker push \
                    'localhost:18080/buy-02/frontend:${IMAGE_TAG}'
            """
        }
            }

            post {
                always {
                    sh 'docker logout localhost:18080 || true'
                }
            }
        }

        stage('Deploy') {
            when {
                allOf {
                    expression { params.DEPLOY }
                    not { triggeredBy 'TimerTrigger' }
                }
            }

            agent {
                label 'deployment'
            }

            steps {
                deleteDir()
                unstash 'source'

                withCredentials([
            usernamePassword(
                credentialsId: 'nexus-docker-credentials',
                usernameVariable: 'NEXUS_USERNAME',
                passwordVariable: 'NEXUS_PASSWORD'
            )
        ]) {
                    sh '''
                set -eu

                export IMAGE_TAG="${IMAGE_TAG}"

                trap 'docker logout localhost:18080 >/dev/null 2>&1 || true' EXIT

                printf '%s' "$NEXUS_PASSWORD" |
                    docker login localhost:18080 \
                        --username "$NEXUS_USERNAME" \
                        --password-stdin

                docker compose \
                    -f docker-compose.jenkins.yml \
                    config --quiet

                docker compose \
                    -f docker-compose.jenkins.yml \
                    pull \
                    frontend eureka user product media audit cart order api-gateway
            '''
        }

                withCredentials([
                    string(credentialsId: 'JWT_SECRET',
                        variable: 'JWT_SECRET'),
                    string(credentialsId: 'GATEWAY_KEYSTORE_PASSWORD',
                        variable: 'GATEWAY_KEYSTORE_PASSWORD'),
                    string(credentialsId: 'MINIO_ROOT_USER',
                        variable: 'MINIO_ROOT_USER'),
                    string(credentialsId: 'MINIO_ROOT_PASSWORD',
                        variable: 'MINIO_ROOT_PASSWORD'),
                    string(credentialsId: 'MONGO_ROOT_USERNAME',
                        variable: 'MONGO_ROOT_USERNAME'),
                    string(credentialsId: 'MONGO_ROOT_PASSWORD',
                        variable: 'MONGO_ROOT_PASSWORD'),
                    string(credentialsId: 'ADMIN_NAME',
                        variable: 'ADMIN_NAME'),
                    string(credentialsId: 'ADMIN_EMAIL',
                        variable: 'ADMIN_EMAIL'),
                    string(credentialsId: 'ADMIN_PASSWORD',
                        variable: 'ADMIN_PASSWORD'),
                    file(credentialsId: 'TLS_KEY',
                        variable: 'TLS_KEY'),
                    file(credentialsId: 'TLS_CRT',
                        variable: 'TLS_CRT'),
                    file(credentialsId: 'GATEWAY_KEYSTORE',
                        variable: 'KEYSTORE_FILE')
        ]) {
                    sh '''
                set -eu

                export IMAGE_TAG="${IMAGE_TAG}"

                install -d -m 700 frontend/certs
                install -d -m 700 \
                    backend/api-gateway/src/main/resources

                install -m 600 "$TLS_KEY" \
                    frontend/certs/frontend.key
                install -m 644 "$TLS_CRT" \
                    frontend/certs/frontend.crt
                install -m 600 "$KEYSTORE_FILE" \
                    backend/api-gateway/src/main/resources/gateway-keystore.p12

                docker compose \
                    -f docker-compose.jenkins.yml \
                    config --quiet

                docker compose \
                    -f docker-compose.jenkins.yml \
                    up -d --no-build
            '''
        }
            }
        }

        stage('Deployment Verification') {
            when {
                allOf {
                    expression {
                        params.DEPLOY
                    }

                    not {
                        triggeredBy 'TimerTrigger'
                    }
                }
            }

            agent {
                label 'deployment'
            }

            steps {
                script {
                    retry(6) {
                        sh '''
                            for container in $(docker compose -f docker-compose.jenkins.yml ps -q); do
                                name=$(docker inspect --format='{{.Name}}' "$container")

                                health=$(docker inspect \
                                    --format='{{if .State.Health}}{{.State.Health.Status}}{{end}}' \
                                    "$container")

                                if [ -z "$health" ]; then
                                    echo "$name: no healthcheck (OK)"

                                elif [ "$health" = "healthy" ]; then
                                    echo "$name: healthy (OK)"

                                else
                                    echo "$name: $health (FAIL)"
                                    sleep 5
                                    exit 1
                                fi
                            done
                        '''

                        echo 'All containers are healthy.'
                    }

                    echo "Deployment ${env.IMAGE_TAG} is healthy."
                }
            }

            post {
                failure {
                    script {
                        echo 'Deployment verification failed.'
                        rollbackDeployment()
                    }
                }
            }
        }

        stage('e2e Verification') {
            when {
                allOf {
                    expression { params.DEPLOY }
                    not { triggeredBy 'TimerTrigger' }
                }
            }
            agent {
                label 'deployment'
            }
            steps {
                script {
                    echo 'Waiting for Auth API to become fully ready...'
                    sh '''
                # Loop until the auth endpoint responds with a 400 or 200 (not 401/403/502/down)
                # Sending an empty POST to login returns 400 Bad Request when the security filter is ready
                timeout 60 bash -c '
                    until [ "$(curl -k -s -o /dev/null -w "%{http_code}" -X POST https://localhost:8080/api/users/auth/login -H "Content-Type: application/json" -d "{}")" = "400" ]; do
                        echo "Auth service not ready yet (security context loading), waiting 3s..."
                        sleep 3
                    done
                '
                echo "Auth service is ready!"
            '''

                    dir('e2e') {
                        sh 'npm ci'
                        sh 'npx playwright test'
                    }
                }
            }
            post {
                always {
                    junit(testResults: 'e2e/test-reports/playwright-results.xml')
                }
                failure {
                    script {
                        echo 'E2E tests failed.'
                        rollbackDeployment()
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                if (params.SEND_NOTIFICATIONS) {
                    catchError(
                        buildResult: 'SUCCESS',
                        stageResult: 'UNSTABLE'
                    ) {
                        mail(
                            to: env.NOTIFICATION_EMAIL,
                            subject: "Build #${env.BUILD_NUMBER} — ${env.JOB_NAME} — SUCCESS",
                            body: """
                                Pipeline completed successfully.

                                Job: ${env.JOB_NAME}
                                Build: #${env.BUILD_NUMBER}
                                Version: ${env.IMAGE_TAG}
                                Test scope: ${params.TEST_SCOPE}
                                Status: SUCCESS

                                Logs:
                                ${env.BUILD_URL}
                            """.stripIndent()
                        )
                    }
                }
            }
        }

        failure {
            script {
                if (params.SEND_NOTIFICATIONS) {
                    catchError(
                        buildResult: 'FAILURE',
                        stageResult: 'UNSTABLE'
                    ) {
                        mail(
                            to: env.NOTIFICATION_EMAIL,
                            subject: "Build #${env.BUILD_NUMBER} — ${env.JOB_NAME} — FAILURE",
                            body: """
                                Pipeline failed.

                                Job: ${env.JOB_NAME}
                                Build: #${env.BUILD_NUMBER}
                                Version: ${env.IMAGE_TAG}
                                Test scope: ${params.TEST_SCOPE}
                                Status: FAILURE

                                Check the Jenkins console output:
                                ${env.BUILD_URL}
                            """.stripIndent()
                        )
                    }
                }
            }
        }
    }
}
