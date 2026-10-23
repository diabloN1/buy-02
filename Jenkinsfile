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
        error('Deployment verification failed and rollback is disabled.')
    }

    def previousBuild = currentBuild.previousSuccessfulBuild

    if (previousBuild == null) {
        error('No previous successful build exists for rollback.')
    }

    def previousVersion = "1.0.${previousBuild.number}"
    echo "Rolling back to version ${previousVersion} from Nexus..."

    withCredentials([
        usernamePassword(
            credentialsId: 'nexus-docker-credentials',
            usernameVariable: 'NEXUS_USERNAME',
            passwordVariable: 'NEXUS_PASSWORD'
        )
    ]) {
        sh """
            set -eu
            printf '%s' "\$NEXUS_PASSWORD" | docker login localhost:18080 --username "\$NEXUS_USERNAME" --password-stdin
            export IMAGE_TAG='${previousVersion}'
            docker compose -f docker-compose.jenkins.yml pull
            docker compose -f docker-compose.jenkins.yml up -d --no-build
        """
    }

    echo "Rollback to ${previousVersion} completed successfully."
    error("Deployment failed. Application rolled back to ${previousVersion}.")
}

pipeline {
    agent none

    options {
        skipDefaultCheckout(true)
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
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
        NEXUS_MAVEN_URL = 'http://localhost:8081/repository'
        NEXUS_DOCKER_REGISTRY = 'localhost:18080'
    }

    stages {
        stage('Checkout Source') {
            agent { label 'backend' }
            steps {
                deleteDir()
                checkout scm
                stash name: 'source', includes: '**'
            }
        }

        stage('Backend CI') {
            agent { label 'backend' }
            stages {
                stage('Prepare Workspace & Settings') {
                    steps {
                        deleteDir()
                        unstash 'source'

                        // Write settings.xml to proxy dependencies and define credentials
                        writeFile file: '.maven-settings.xml', text: '''<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
    <servers>
        <server>
            <id>nexus-releases</id>
            <username>${env.NEXUS_USERNAME}</username>
            <password>${env.NEXUS_PASSWORD}</password>
        </server>
        <server>
            <id>nexus-snapshots</id>
            <username>${env.NEXUS_USERNAME}</username>
            <password>${env.NEXUS_PASSWORD}</password>
        </server>
    </servers>
    <mirrors>
        <mirror>
            <id>nexus-group</id>
            <mirrorOf>*</mirrorOf>
            <url>http://localhost:8081/repository/maven-public/</url>
        </mirror>
    </mirrors>
</settings>'''
                        stash name: 'maven-settings', includes: '.maven-settings.xml'
                    }
                }

                stage('Version & Build Backend') {
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
                                            // Set POM version to 1.0.<BUILD_NUMBER> for traceability
                                            sh """
                                                chmod +x ./mvnw
                                                ./mvnw -B versions:set -DnewVersion=${IMAGE_TAG} -DgenerateBackupPoms=false
                                                ./mvnw -B -s .maven-settings.xml clean package -DskipTests
                                            """
                                        }
                                    }
                                }
                                parallel builds
                            }
                        }
                    }
                }

                stage('Test Backend') {
                    when {
                        expression {
                            params.TEST_SCOPE == 'all' || params.TEST_SCOPE == 'backend'
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
                                            sh './mvnw -B -s .maven-settings.xml test'
                                        }
                                    }
                                }
                                parallel tests
                            }
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: 'backend/**/target/surefire-reports/*.xml'
                        }
                    }
                }

                stage('Publish Maven Artifacts to Nexus') {
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
                                            // Deploy to Nexus release or snapshot repository explicitly
                                            sh """
                                                ./mvnw -B -s .maven-settings.xml deploy -DskipTests \
                                                -DaltReleaseDeploymentRepository=nexus-releases::default::${NEXUS_MAVEN_URL}/maven-releases/ \
                                                -DaltSnapshotDeploymentRepository=nexus-snapshots::default::${NEXUS_MAVEN_URL}/maven-snapshots/
                                            """
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
                        stash(
                            name: 'backend-jars',
                            includes: 'backend/**/target/*.jar',
                            allowEmpty: true
                        )
                    }
                }
            }
        }

        stage('Frontend CI') {
            agent { label 'frontend' }
            stages {
                stage('Checkout & Build Frontend') {
                    steps {
                        deleteDir()
                        unstash 'source'
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }

                stage('Test Frontend') {
                    when {
                        expression {
                            params.TEST_SCOPE == 'all' || params.TEST_SCOPE == 'frontend'
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --watchAll=false'
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: 'frontend/test-reports/*.xml'
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
            agent { label 'backend' }
            steps {
                deleteDir()
                unstash 'source'
                unstash 'backend-artifacts'

                script {
                    if (params.TEST_SCOPE == 'all' || params.TEST_SCOPE == 'frontend') {
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
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate(abortPipeline: true)
                }
            }
        }

        stage('Build & Push Docker Images to Nexus') {
            when {
                allOf {
                    expression { params.DEPLOY }
                    not { triggeredBy 'TimerTrigger' }
                }
            }
            agent { label 'deployment' }
            steps {
                deleteDir()
                unstash 'source'
                unstash 'backend-jars'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-docker-credentials',
                        usernameVariable: 'NEXUS_USERNAME',
                        passwordVariable: 'NEXUS_PASSWORD'
                    ),
                    file(credentialsId: 'TLS_KEY', variable: 'TLS_KEY'),
                    file(credentialsId: 'TLS_CRT', variable: 'TLS_CRT'),
                    file(credentialsId: 'GATEWAY_KEYSTORE', variable: 'KEYSTORE_FILE')
                ]) {
                    sh '''
                        set -eu
                        mkdir -p frontend/certs
                        cp "$TLS_KEY" frontend/certs/frontend.key
                        cp "$TLS_CRT" frontend/certs/frontend.crt

                        mkdir -p backend/api-gateway/src/main/resources
                        cp "$KEYSTORE_FILE" backend/api-gateway/src/main/resources/gateway-keystore.p12

                        # Log in to Nexus Docker Registry
                        printf '%s' "$NEXUS_PASSWORD" | docker login localhost:18080 --username "$NEXUS_USERNAME" --password-stdin
                    '''

                    script {
                        services.each { service ->
                            def image = "${NEXUS_DOCKER_REGISTRY}/buy-02/${service}:${IMAGE_TAG}"
                            sh """
                                set -eu
                                docker build -t '${image}' 'backend/${service}'
                                docker push '${image}'
                            """
                        }
                    }

                    sh """
                        set -eu
                        docker build -t '${NEXUS_DOCKER_REGISTRY}/buy-02/frontend:${IMAGE_TAG}' ./frontend
                        docker push '${NEXUS_DOCKER_REGISTRY}/buy-02/frontend:${IMAGE_TAG}'
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
            agent { label 'deployment' }
            steps {
                deleteDir()
                unstash 'source'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-docker-credentials',
                        usernameVariable: 'NEXUS_USERNAME',
                        passwordVariable: 'NEXUS_PASSWORD'
                    ),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GATEWAY_KEYSTORE_PASSWORD', variable: 'GATEWAY_KEYSTORE_PASSWORD'),
                    string(credentialsId: 'MINIO_ROOT_USER', variable: 'MINIO_ROOT_USER'),
                    string(credentialsId: 'MINIO_ROOT_PASSWORD', variable: 'MINIO_ROOT_PASSWORD'),
                    string(credentialsId: 'MONGO_ROOT_USERNAME', variable: 'MONGO_ROOT_USERNAME'),
                    string(credentialsId: 'MONGO_ROOT_PASSWORD', variable: 'MONGO_ROOT_PASSWORD'),
                    string(credentialsId: 'ADMIN_NAME', variable: 'ADMIN_NAME'),
                    string(credentialsId: 'ADMIN_EMAIL', variable: 'ADMIN_EMAIL'),
                    string(credentialsId: 'ADMIN_PASSWORD', variable: 'ADMIN_PASSWORD'),
                    file(credentialsId: 'TLS_KEY', variable: 'TLS_KEY'),
                    file(credentialsId: 'TLS_CRT', variable: 'TLS_CRT'),
                    file(credentialsId: 'GATEWAY_KEYSTORE', variable: 'KEYSTORE_FILE')
                ]) {
                    sh '''
                        set -eu
                        mkdir -p frontend/certs
                        mkdir -p backend/api-gateway/src/main/resources

                        cp "$TLS_KEY" frontend/certs/frontend.key
                        cp "$TLS_CRT" frontend/certs/frontend.crt
                        cp "$KEYSTORE_FILE" backend/api-gateway/src/main/resources/gateway-keystore.p12

                        export IMAGE_TAG="${IMAGE_TAG}"

                        # Authenticate and pull the freshly pushed images from Nexus (Requirement 6)
                        printf '%s' "$NEXUS_PASSWORD" | docker login localhost:18080 --username "$NEXUS_USERNAME" --password-stdin
                        docker compose -f docker-compose.jenkins.yml config --quiet
                        docker compose -f docker-compose.jenkins.yml pull
                        docker compose -f docker-compose.jenkins.yml up -d --no-build
                    '''
                }
            }
        }

        stage('Deployment Verification') {
            when {
                allOf {
                    expression { params.DEPLOY }
                    not { triggeredBy 'TimerTrigger' }
                }
            }
            agent { label 'deployment' }
            steps {
                script {
                    retry(6) {
                        sh '''
                            for container in $(docker compose -f docker-compose.jenkins.yml ps -q); do
                                name=$(docker inspect --format='{{.Name}}' "$container")
                                health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container")

                                if [ -z "$health" ]; then
                                    echo "$name: no healthcheck (OK)"
                                elif [ "$health" = "healthy" ]; then
                                    echo "$name: healthy (OK)"
                                else
                                    echo "$name: $health (WAITING/FAIL)"
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
            agent { label 'deployment' }
            steps {
                script {
                    retry(3) {
                        try {
                            dir('e2e') {
                                sh 'npm ci'
                                sh 'npx playwright test'
                            }
                        } catch (Exception e) {
                            echo 'E2E verification failed. Retrying in 10s...'
                            sleep(time: 10, unit: 'SECONDS')
                            throw e
                        }
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'e2e/test-reports/*.xml'
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
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
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

                                Logs: ${env.BUILD_URL}
                            """.stripIndent()
                        )
                    }
                }
            }
        }
        failure {
            script {
                if (params.SEND_NOTIFICATIONS) {
                    catchError(buildResult: 'FAILURE', stageResult: 'UNSTABLE') {
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

                                Console Output: ${env.BUILD_URL}
                            """.stripIndent()
                        )
                    }
                }
            }
        }
    }
}
