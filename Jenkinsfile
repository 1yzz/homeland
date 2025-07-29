pipeline {
    agent any
    
    environment {
        // 数据库配置 - 拼接基础URL和数据库名
        DATABASE_URL = "${credentials('VaioMysql')}homeland_sites"
        
        // 系统配置
        NODE_ENV = 'production'
        
        // 部署配置
        DEPLOY_PATH = '/var/www/homeland'
        PM2_APP_NAME = 'homeland'
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
                # 验证Docker环境
                docker --version
                echo 'Docker环境验证完成'
                
                # 验证数据库连接配置
                if [ -n "$DATABASE_URL" ]; then
                    echo "✅ 数据库URL已配置: ${DATABASE_URL%/*}/[database]"
                else
                    echo "❌ 数据库URL未配置"
                    exit 1
                fi
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                # 创建部署目录
                sudo mkdir -p ''' + DEPLOY_PATH + '''
                sudo chown $USER:$USER ''' + DEPLOY_PATH + '''
                
                # 复制文件到部署目录
                cp -r . ''' + DEPLOY_PATH + '''/
                cd ''' + DEPLOY_PATH + '''
                
                # 设置执行权限
                chmod +x docker-deploy.sh
                
                # 停止并删除现有容器
                docker stop homeland-app || true
                docker rm homeland-app || true
                
                # 构建Docker镜像
                docker build -t homeland:latest .
                
                # 启动容器
                docker run -d \
                    --name homeland-app \
                    -p 4235:4235 \
                    -e DATABASE_URL="$DATABASE_URL" \
                    -e NODE_ENV=production \
                    --restart unless-stopped \
                    homeland:latest
                
                # 等待容器启动
                sleep 15
                
                # 运行数据库迁移
                docker exec homeland-app npx prisma db push || true
                
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
        }
        success {
            echo '部署成功！'
        }
        failure {
            echo '部署失败，请检查日志'
        }
    }
} 