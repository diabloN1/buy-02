def services = [
    'media-service',
    'user-service',
    'product-service'
]

pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                script {
                    services.each { service ->
                        dir("backend/${service}") {
                            sh './mvnw package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    services.each { service ->
                        dir("backend/${service}") {
                            sh './mvnw test'
                        }
                    }
                }
            }
        }
    }
}