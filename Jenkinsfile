pipeline {
    agent any
    
    environment {
        // Docker构建配置
        DOCKER_BUILDKIT=1
        
        // 系统配置
        NODE_ENV = 'production'
        PORT = '4235'
        HOSTNAME = '0.0.0.0'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo '代码检出完成'
            }
        }
        
        stage('Verify Environment') {
            steps {
                sh '''
                echo "当前用户: $(whoami)"
                
                # 验证Docker环境
                docker --version
                echo 'Docker环境验证完成'
                
                # 获取数据库凭据
                echo "✅ 准备获取数据库凭据"
                '''
            }
        }
        
        stage('Deploy with Docker') {
            steps {
                withCredentials([string(credentialsId: 'VaioMysql', variable: 'MYSQL_URL')]) {
                    sh '''
                    # 构建完整的数据库URL
                    export DATABASE_URL="${MYSQL_URL}/homeland_sites"
                    # 替换数据库URL中的localhost为host.docker.internal
                    export DOCKER_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/localhost/host.docker.internal/g')
                    echo "🔧 Docker容器内数据库URL: $DOCKER_DATABASE_URL"
                
                # 停止并删除现有容器
                docker stop homeland-app 2>/dev/null || true
                docker rm homeland-app 2>/dev/null || true
                
                echo "🔧 使用Docker部署应用..."
                
                # 构建镜像（使用临时DATABASE_URL用于prisma generate）
                docker build \
                    --build-arg DATABASE_URL="mysql://temp:temp@localhost:3306/temp" \
                    --build-arg NODE_ENV=production \
                    --build-arg PORT=4235 \
                    --build-arg HOSTNAME=0.0.0.0 \
                    -t homeland:latest .
                
                # 启动容器
                docker run -d \
                    --name homeland-app \
                    --network host \
                    --restart unless-stopped \
                    -e DATABASE_URL="$DOCKER_DATABASE_URL" \
                    -e NODE_ENV=production \
                    -e PORT=4235 \
                    -e HOSTNAME=0.0.0.0 \
                    homeland:latest
                
                # 验证环境变量传递
                echo "🔍 验证容器环境变量:"
                docker exec homeland-app env | grep DATABASE_URL
                
                # 等待应用启动
                sleep 15
                
                # 运行数据库迁移
                docker exec homeland-app npx prisma db push || true
                
                echo '应用部署完成'
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                sh '''
                # 等待应用启动
                sleep 10
                
                # 健康检查
                curl -f http://localhost:4235 || exit 1
                echo '健康检查通过'
                
                # 显示容器状态
                docker ps --filter name=homeland-app
                '''
            }
        }
        
        stage('Nginx Config') {
            steps {
                sh '''
                # 更新Nginx配置（如果需要）
                sudo nginx -t
                sudo systemctl reload nginx
                echo 'Nginx配置更新完成'
                '''
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline执行完成'
            sh '''
                # 清理完成
                echo "清理完成"
            '''
        }
        success {
            echo '部署成功！'
            sh '''
                echo "📊 应用地址: http://localhost:4235"
                echo "🔍 查看日志: docker logs -f homeland-app"
            '''
        }
        failure {
            echo '部署失败，请检查日志'
            sh '''
                echo "🔍 查看容器日志:"
                docker logs homeland-app
            '''
        }
    }
} 