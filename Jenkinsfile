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
    }
}