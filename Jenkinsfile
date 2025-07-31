pipeline {
    agent any
    
    environment {
        // Docker构建配置
        DOCKER_BUILDKIT = '1'
        
        // 应用配置
        NODE_ENV = 'production'
        APP_PORT = '4235'
        APP_HOSTNAME = '0.0.0.0'
        
        // 数据库配置
        DB_NAME = 'homeland_sites'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo '代码检出完成'
            }
        }
        
        stage('Deploy with Docker') {
            steps {
                withCredentials([string(credentialsId: 'VaioMysql', variable: 'MYSQL_URL')]) {
                    sh '''
                    # 构建数据库URL
                    export DATABASE_URL="${MYSQL_URL}/${DB_NAME}"
                    
                    # 停止并删除现有容器
                    docker stop homeland-app 2>/dev/null || true
                    docker rm homeland-app 2>/dev/null || true
                
                # 构建镜像
                docker build \
                    --build-arg DATABASE_URL="$DATABASE_URL" \
                    --build-arg NODE_ENV="$NODE_ENV" \
                    --build-arg PORT="$APP_PORT" \
                    --build-arg HOSTNAME="$APP_HOSTNAME" \
                    --network host \
                    -t homeland:latest .
                
                # 启动容器
                docker run -d \
                    --name homeland-app \
                    --network host \
                    --restart unless-stopped \
                    -e DATABASE_URL="$DATABASE_URL" \
                    -e NODE_ENV="$NODE_ENV" \
                    -e PORT="$APP_PORT" \
                    -e HOSTNAME="$APP_HOSTNAME" \
                    homeland:latest
                
                # 等待应用启动
                sleep 10
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                sh '''
                # 健康检查
                curl -f http://localhost:4235 || exit 1
                echo '✅ 应用部署成功'
                '''
            }
        }
    }
    
    post {
        success {
            echo '🎉 部署成功！'
            sh '''
                echo "📊 应用地址: http://localhost:4235"
                echo "🔍 查看日志: docker logs -f homeland-app"
            '''
        }
        failure {
            echo '❌ 部署失败'
            sh '''
                echo "🔍 容器日志:"
                docker logs --tail 20 homeland-app 2>/dev/null || echo "容器未启动"
            '''
        }
    }
} 