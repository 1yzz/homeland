pipeline {
    agent any
    
    environment {
        // 数据库配置
        DATABASE_URL = credentials('VaioMysql')
        DATABASE_TABLE = 'homeland_sites'
        
        // 系统配置
        NODE_ENV = 'production'
        NODE_VERSION = '18.20.0'
        
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
        
        stage('Setup Node.js') {
            steps {
                sh '''
                # 设置Node.js环境
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                
                # 使用指定版本的Node.js
                nvm use ''' + NODE_VERSION + '''
                nvm alias default ''' + NODE_VERSION + '''
                
                # 验证Node.js版本
                echo "Node.js版本: $(node --version)"
                echo "npm版本: $(npm --version)"
                echo "pnpm版本: $(pnpm --version)"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                # 设置Node.js环境
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use ''' + NODE_VERSION + '''
                
                # 安装依赖
                pnpm ci --production=false
                echo '依赖安装完成'
                '''
            }
        }
        
        stage('Database Setup') {
            steps {
                sh '''
                # 设置Node.js环境
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use ''' + NODE_VERSION + '''
                
                # 生成Prisma客户端
                npx prisma generate
                echo 'Prisma客户端生成完成'
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                # 设置Node.js环境
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use ''' + NODE_VERSION + '''
                
                # 构建应用
                pnpm run build
                echo '应用构建完成'
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                # 设置Node.js环境
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use ''' + NODE_VERSION + '''
                
                # 运行代码检查
                pnpm run lint
                echo '代码检查完成'
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                # 设置Node.js环境
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use ''' + NODE_VERSION + '''
                
                # 创建部署目录
                sudo mkdir -p ''' + DEPLOY_PATH + '''
                sudo chown $USER:$USER ''' + DEPLOY_PATH + '''
                
                # 复制构建文件到部署目录
                cp -r . ''' + DEPLOY_PATH + '''/
                cd ''' + DEPLOY_PATH + '''
                
                # 安装生产依赖
                pnpm ci --only=production
                
                # 生成Prisma客户端
                npx prisma generate
                
                # 使用PM2启动应用
                pm2 delete ''' + PM2_APP_NAME + ''' || true
                pm2 start pnpm --name "''' + PM2_APP_NAME + '''" -- start
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