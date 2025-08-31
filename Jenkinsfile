pipeline {
    agent any
    
    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['staging', 'production'],
            description: '部署环境选择'
        )
        string(
            name: 'APP_PORT',
            defaultValue: '3000',
            description: '应用端口'
        )
        string(
            name: 'EXPOSE_PORT', 
            defaultValue: '3000',
            description: '对外暴露端口'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: '跳过测试和代码检查'
        )
        booleanParam(
            name: 'FORCE_REBUILD',
            defaultValue: false,
            description: '强制重新构建（清理缓存）'
        )
    }
    
    environment {
        // Docker构建配置
        DOCKER_BUILDKIT = '1'
        NODE_ENV = 'production'
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
        APP_NAME = 'homeland-app'
        
        // 从参数或环境变量获取配置
        PORT = "${params.APP_PORT}"
        EXPOSE_PORT = "${params.EXPOSE_PORT}"
        
        // 应用配置
        NEXT_PUBLIC_APP_NAME = 'Homeland'
        NEXT_PUBLIC_APP_VERSION = "${env.BUILD_NUMBER}.0.0"
    }
    
    options {
        // 保留最近10次构建
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // 构建超时30分钟
        timeout(time: 30, unit: 'MINUTES')
        // 添加时间戳到控制台输出
        timestamps()
    }
    
    stages {
        stage('Checkout & Info') {
            steps {
                script {
                    // 检出代码
                    checkout scm
                    
                    // 显示构建信息
                    echo """
                    🏗️  Jenkins CI/CD 流水线启动
                    
                    📋 构建信息:
                       构建编号: ${env.BUILD_NUMBER}
                       Git提交: ${env.GIT_COMMIT?.take(7) ?: 'unknown'}
                       分支: ${env.GIT_BRANCH ?: 'unknown'}
                       部署环境: ${params.DEPLOY_ENV}
                       
                    ⚙️  应用配置:
                       应用端口: ${params.APP_PORT}
                       暴露端口: ${params.EXPOSE_PORT}
                       镜像标签: ${env.IMAGE_TAG}
                       跳过测试: ${params.SKIP_TESTS}
                       强制重建: ${params.FORCE_REBUILD}
                    """
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                sh '''
                echo "🔧 设置构建环境..."
                
                # 检查Docker
                docker --version
                
                # 启用pnpm
                corepack enable || true
                
                # 检查或安装pnpm
                if ! pnpm -v; then
                    echo "安装pnpm..."
                    npm install -g pnpm
                fi
                
                echo "   ✅ Node.js $(node --version)"
                echo "   ✅ pnpm $(pnpm --version)"
                echo "   ✅ Docker $(docker --version | cut -d' ' -f3)"
                '''
            }
        }
        
        stage('Clean & Install') {
            when {
                anyOf {
                    params.FORCE_REBUILD
                    not { fileExists('node_modules/.pnpm') }
                }
            }
            steps {
                sh '''
                echo "🧹 清理构建环境..."
                
                # 清理构建文件
                rm -rf .next out dist node_modules/.cache || true
                
                # 如果强制重建，清理依赖
                if [ "$FORCE_REBUILD" = "true" ]; then
                    echo "   强制清理依赖..."
                    rm -rf node_modules || true
                fi
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                echo "📦 安装依赖..."
                pnpm install --frozen-lockfile
                echo "   依赖安装完成"
                '''
            }
        }
        
        stage('Code Quality') {
            when {
                not { params.SKIP_TESTS }
            }
            parallel {
                stage('Type Check') {
                    steps {
                        sh '''
                        echo "🔍 TypeScript 类型检查..."
                        pnpm type-check
                        '''
                    }
                }
                stage('Lint Check') {
                    steps {
                        sh '''
                        echo "📝 ESLint 代码检查..."
                        pnpm lint
                        '''
                    }
                }
            }
        }
        
        stage('Build Application') {
            steps {
                sh '''
                echo "🔨 构建应用..."
                pnpm build
                echo "   应用构建完成"
                '''
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    sh '''
                    echo "🐳 构建Docker镜像..."
                    
                    # 构建镜像
                    docker build \
                        --build-arg NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME}" \
                        --build-arg NEXT_PUBLIC_APP_VERSION="${NEXT_PUBLIC_APP_VERSION}" \
                        --build-arg DATABASE_URL="${DATABASE_URL:-}" \
                        --build-arg WATCHDOG_HOST="${WATCHDOG_HOST:-localhost}" \
                        --build-arg WATCHDOG_PORT="${WATCHDOG_PORT:-50051}" \
                        --build-arg WATCHDOG_TIMEOUT="${WATCHDOG_TIMEOUT:-10000}" \
                        -t homeland:${IMAGE_TAG} \
                        -t homeland:latest \
                        .
                    
                    echo "   镜像构建完成: homeland:${IMAGE_TAG}"
                    '''
                }
            }
        }
        
        stage('Deploy Container') {
            steps {
                sh '''
                echo "🚀 部署容器..."
                
                # 停止并删除现有容器
                if docker ps -q --filter name=${APP_NAME} | grep -q .; then
                    echo "   停止现有容器..."
                    docker stop ${APP_NAME}
                fi
                
                if docker ps -aq --filter name=${APP_NAME} | grep -q .; then
                    echo "   删除现有容器..."
                    docker rm ${APP_NAME}
                fi
                
                # 启动新容器
                docker run -d \
                    --name ${APP_NAME} \
                    --restart unless-stopped \
                    -p ${EXPOSE_PORT}:${PORT} \
                    -e NODE_ENV=production \
                    -e PORT=${PORT} \
                    -e HOSTNAME=0.0.0.0 \
                    -e DATABASE_URL="${DATABASE_URL:-}" \
                    -e WATCHDOG_HOST="${WATCHDOG_HOST:-localhost}" \
                    -e WATCHDOG_PORT="${WATCHDOG_PORT:-50051}" \
                    -e WATCHDOG_TIMEOUT="${WATCHDOG_TIMEOUT:-10000}" \
                    homeland:${IMAGE_TAG}
                
                echo "   容器启动完成"
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh '''
                    echo "🔍 应用健康检查..."
                    
                    # 等待应用启动
                    echo "   等待应用启动..."
                    max_attempts=30
                    attempt=1
                    
                    while [ $attempt -le $max_attempts ]; do
                        if curl -f http://localhost:${EXPOSE_PORT}/api/health >/dev/null 2>&1; then
                            echo "   ✅ 应用启动成功！"
                            break
                        fi
                        
                        echo "   尝试 $attempt/$max_attempts..."
                        sleep 2
                        attempt=$((attempt + 1))
                        
                        if [ $attempt -gt $max_attempts ]; then
                            echo "   ❌ 应用启动超时"
                            echo "   🔍 容器日志:"
                            docker logs --tail 20 ${APP_NAME}
                            exit 1
                        fi
                    done
                    
                    # 额外的健康检查
                    echo "   执行详细健康检查..."
                    response=$(curl -s http://localhost:${EXPOSE_PORT}/api/health)
                    echo "   健康检查响应: $response"
                    '''
                }
            }
        }
        
        stage('Post-Deploy Info') {
            steps {
                sh '''
                echo ""
                echo "📊 部署信息:"
                echo "   应用地址: http://localhost:${EXPOSE_PORT}"
                echo "   健康检查: http://localhost:${EXPOSE_PORT}/api/health"
                echo "   容器名称: ${APP_NAME}"
                echo "   镜像标签: homeland:${IMAGE_TAG}"
                echo ""
                echo "📋 容器状态:"
                docker ps --filter name=${APP_NAME} --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                '''
            }
        }
    }
    
    post {
        always {
            // 清理工作空间中的构建文件，但保留源代码
            sh '''
            echo "🧹 清理临时文件..."
            rm -rf .next out dist node_modules/.cache || true
            '''
        }
        
        success {
            script {
                echo """
                🎉 部署成功！
                
                📊 应用信息:
                   地址: http://localhost:${params.EXPOSE_PORT}
                   环境: ${params.DEPLOY_ENV}
                   版本: ${env.NEXT_PUBLIC_APP_VERSION}
                   镜像: homeland:${env.IMAGE_TAG}
                
                📋 管理命令:
                   查看日志: docker logs -f ${env.APP_NAME}
                   重启应用: docker restart ${env.APP_NAME}
                   停止应用: docker stop ${env.APP_NAME}
                """
            }
        }
        
        failure {
            script {
                echo """
                ❌ 部署失败！
                
                🔍 故障排查:
                   1. 查看构建日志
                   2. 检查容器状态: docker ps -a --filter name=${env.APP_NAME}
                   3. 查看容器日志: docker logs ${env.APP_NAME}
                   4. 检查端口占用: netstat -tulpn | grep ${params.EXPOSE_PORT}
                """
                
                // 收集故障信息
                sh '''
                echo "📋 故障信息收集..."
                echo "=== 容器状态 ==="
                docker ps -a --filter name=${APP_NAME} || true
                echo "=== 容器日志 ==="
                docker logs --tail 50 ${APP_NAME} 2>/dev/null || echo "无法获取容器日志"
                echo "=== 系统资源 ==="
                df -h
                free -h
                ''' 
            }
        }
        
        cleanup {
            // 清理旧的Docker镜像（保留最近5个）
            sh '''
            echo "🗑️  清理旧镜像..."
            docker images homeland --format "{{.Tag}}" | grep -E "^[0-9]+" | sort -nr | tail -n +6 | xargs -r docker rmi homeland: 2>/dev/null || true
            '''
        }
    }
} 