def services = [
    'media-service',
    'user-service',
    'product-service'
]

pipeline {
    agent any

    environment {
        JWT_SECRET= credentials('JWT_SECRET')
        GATEWAY_KEYSTORE_PASSWORD= credentials('GATEWAY_KEYSTORE_PASSWORD')
        MINIO_ROOT_USER= credentials('MINIO_ROOT_USER')
        MINIO_ROOT_PASSWORD= credentials('MINIO_ROOT_PASSWORD')
        MONGO_ROOT_USERNAME= credentials('MONGO_ROOT_USERNAME')
        MONGO_ROOT_PASSWORD= credentials('MONGO_ROOT_PASSWORD')
        ADMIN_NAME= credentials('ADMIN_NAME')
        ADMIN_EMAIL= credentials('ADMIN_EMAIL')
        ADMIN_PASSWORD= credentials('ADMIN_PASSWORD')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build') {
            steps {
                script {
                    def builds = [:]

                    services.each { service ->
                        def currentService = service

                        builds[currentService] = {
                            dir("backend/${currentService}") {
                                sh './mvnw package -DskipTests'
                            }
                        }
                    }

                    parallel builds
                }
            }
        }

        stage('Backend Unit Tests') {
            steps {
                script {
                    def tests = [:]

                    services.each { service ->
                        def currentService = service

                        tests[currentService] = {
                            dir("backend/${currentService}") {
                                sh './mvnw test'
                            }
                        }
                    }

                    parallel tests
                }
            }
        }

        stage('Check Permissions') {
            steps {
                sh '''
                    whoami
                    ls -ld backend/api-gateway
                    ls -ld backend/api-gateway/src
                    ls -ld backend/api-gateway/src/main
                    ls -ld backend/api-gateway/src/main/resources
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'GATEWAY_KEYSTORE',
                        variable: 'KEYSTORE_FILE'
                    )
                ]) {
                    sh '''
                        cp "$KEYSTORE_FILE" backend/api-gateway/src/main/resources/gateway-keystore.p12

                        docker compose up -d --build
                    '''
                }
            }
        }
    }
}
