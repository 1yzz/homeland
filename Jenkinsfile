pipeline {
    agent any
    
    environment {
        // 数据库配置
        DATABASE_URL = credentials('VaioMysql')
        DATABASE_TABLE = 'homeland_sites'
        
        // 系统配置
        NODE_ENV = 'production'
        NODE_VERSION = 'v16.20.2'
        
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
        
        stage('Setup Environment') {
            steps {
                sh '''
                # 设置Node.js环境
                export PATH=$PATH:/root/.nvm/versions/node/$NODE_VERSION/bin
                
                # 验证环境
                echo "Node.js版本: $(node --version)"
                echo "npm版本: $(npm --version)"
                echo "使用npm作为包管理器"
                '''
            }
        }
        
        stage('Build & Test') {
            steps {
                sh '''
                # 设置Node.js环境
                export PATH=$PATH:/root/.nvm/versions/node/$NODE_VERSION/bin
                
                # 安装依赖
                npm ci
                echo '依赖安装完成'
                
                # 生成Prisma客户端
                npx prisma generate
                echo 'Prisma客户端生成完成'
                
                # 构建应用
                npm run build
                echo '应用构建完成'
                
                # 运行代码检查
                npm run lint
                echo '代码检查完成'
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                # 设置Node.js环境
                export PATH=$PATH:/root/.nvm/versions/node/$NODE_VERSION/bin
                
                # 创建部署目录
                sudo mkdir -p ''' + DEPLOY_PATH + '''
                sudo chown $USER:$USER ''' + DEPLOY_PATH + '''
                
                # 复制构建文件到部署目录
                cp -r . ''' + DEPLOY_PATH + '''/
                cd ''' + DEPLOY_PATH + '''
                
                # 安装生产依赖
                npm ci --only=production
                
                # 生成Prisma客户端
                npx prisma generate
                
                # 使用PM2启动应用
                pm2 delete ''' + PM2_APP_NAME + ''' || true
                pm2 start npm --name "''' + PM2_APP_NAME + '''" -- start
                pm2 save
                
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