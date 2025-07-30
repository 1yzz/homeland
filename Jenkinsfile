pipeline {
    agent any
    
    environment {
        // 数据库配置 - 使用host.docker.internal访问宿主机服务
        DATABASE_URL = "${credentials('VaioMysql')}homeland_sites"
        
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
                docker compose version
                echo 'Docker环境验证完成'
                
                # 验证数据库连接配置
                if [ -n "$DATABASE_URL" ]; then
                    echo "✅ 数据库URL已配置: ${DATABASE_URL}"
                else
                    echo "❌ 数据库URL未配置"
                    exit 1
                fi
                '''
            }
        }
        
        stage('Prepare Database URL') {
            steps {
                sh '''
                # 替换数据库URL中的localhost为host.docker.internal
                DOCKER_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/localhost/host.docker.internal/g')
                
                echo "🔧 Docker容器内数据库URL: $DOCKER_DATABASE_URL"
                
                # 设置环境变量供后续步骤使用
                echo "DATABASE_URL=$DOCKER_DATABASE_URL" > .env.jenkins
                '''
            }
        }
        
        stage('Deploy with Docker Compose') {
            steps {
                sh '''
                # 加载环境变量
                source .env.jenkins
                
                # 停止并删除现有容器
                docker compose down || true
                
                echo "🔧 使用Docker Compose部署应用..."
                
                # 构建并启动服务
                docker compose up -d --build
                
                # 等待应用启动
                sleep 15
                
                # 运行数据库迁移
                docker compose exec homeland npx prisma db push || true
                
                echo '应用部署完成'
                '''
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
                docker compose ps
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
                # 清理临时文件
                rm -f .env.jenkins
            '''
        }
        success {
            echo '部署成功！'
            sh '''
                echo "📊 应用地址: http://localhost:4235"
                echo "🔍 查看日志: docker compose logs -f homeland"
            '''
        }
        failure {
            echo '部署失败，请检查日志'
            sh '''
                echo "🔍 查看容器日志:"
                docker compose logs homeland
            '''
        }
    }
} 