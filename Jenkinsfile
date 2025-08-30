pipeline {
    agent any
    
    environment {
        // Docker构建配置
        DOCKER_BUILDKIT = '1'
        NODE_ENV = 'production'
        APP_PORT = '4235'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo '代码检出完成'
            }
        }
        
        stage('Install & Build') {
            steps {
                sh '''
                corepack enable || true
                pnpm -v || npm i -g pnpm
                pnpm install --frozen-lockfile
                pnpm build
                '''
            }
        }

        stage('Deploy with Docker') {
            steps {
                sh '''
                # 停止并删除现有容器
                docker stop homeland-app 2>/dev/null || true
                docker rm homeland-app 2>/dev/null || true

                # 构建镜像（Nginx静态服务）
                docker build -t homeland:latest .

                # 运行容器，映射 4235 -> 80
                docker run -d \
                  --name homeland-app \
                  --restart unless-stopped \
                  -p ${APP_PORT}:80 \
                  homeland:latest

                # 等待应用启动
                sleep 5
                '''
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