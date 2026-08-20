pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit Tests') {
            parallel {
                stage('media-service') {
                    steps {
                        dir('backend/media-service') {
                            sh './mvnw test'
                        }
                    }
                }
                stage('user-service') {
                    steps {
                        dir('backend/user-service') {
                            sh './mvnw test'
                        }
                    }
                }
                stage('product-service') {
                    steps {
                        dir('backend/product-service') {
                            sh './mvnw test'
                        }
                    }
                }
            }
        }
    }
}