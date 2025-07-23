#!/bin/bash

# スクリプトの実行にはroot権限が必要です
if [ "$EUID" -ne 0 ]; then
  echo "エラー: このスクリプトはroot権限で実行する必要があります。"
  echo "使用方法: sudo ./setupfull.sh <your_domain.com> <your_email@example.com>"
  exit 1
fi

# 引数のチェック
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "エラー: ドメイン名とメールアドレスが指定されていません。"
  echo "使用方法: sudo ./setupfull.sh <your_domain.com> <your_email@example.com>"
  echo "例: sudo ./setupfull.sh zenskyn.example.com admin@zenskyn.example.com"
  exit 1
fi

DOMAIN=$1
EMAIL=$2
APP_DIR="/var/www/zenskyn" # アプリケーションのデプロイ先ディレクトリ

echo "--- システムの更新を開始します ---"
apt update -y && apt upgrade -y
if [ $? -ne 0 ]; then echo "エラー: システムの更新に失敗しました。"; exit 1; fi
echo "--- システムの更新が完了しました ---"

echo "--- Node.js のインストールを開始します ---"
# NodeSource から最新のLTSバージョンをインストール
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
if [ $? -ne 0 ]; then echo "エラー: NodeSource のセットアップに失敗しました。"; exit 1; fi
apt install -y nodejs
if [ $? -ne 0 ]; then echo "エラー: Node.js のインストールに失敗しました。"; exit 1; fi
echo "--- Node.js のインストールが完了しました ---"

echo "--- Nginx のインストールを開始します ---"
apt install -y nginx-full
if [ $? -ne 0 ]; then echo "エラー: Nginx のインストールに失敗しました。"; exit 1; fi
echo "--- Nginx のインストールが完了しました ---"

echo "--- Certbot のインストールを開始します ---"
apt install -y certbot python3-certbot-nginx
if [ $? -ne 0 ]; then echo "エラー: Certbot のインストールに失敗しました。"; exit 1; fi
echo "--- Certbot のインストールが完了しました ---"

echo "--- ZenSky N アプリケーションのセットアップを開始します ---"
# アプリケーションディレクトリの作成と権限設定
mkdir -p "$APP_DIR"
if [ $? -ne 0 ]; then echo "エラー: アプリケーションディレクトリの作成に失敗しました。"; exit 1; fi
chown -R "$USER":"$USER" "$APP_DIR" # 現在のユーザーに所有権を与える
chmod -R 755 "$APP_DIR"

# ここにZenSky Nのソースコードを配置する手順が入ります
# 例: git clone https://github.com/your-repo/zenskyn.git "$APP_DIR"
# または、事前にtar.gzなどで固めたものを配置する
echo "注意: ZenSky N のソースコードを '$APP_DIR' に配置してください。"
echo "このスクリプトは、ソースコードが既に '$APP_DIR' に存在するか、手動で配置されることを前提としています。"
echo "npm install と npm run build を実行します。"

# アプリケーションディレクトリに移動して依存関係をインストールし、ビルド
(cd "$APP_DIR" && npm install && npm run build)
if [ $? -ne 0 ]; then echo "エラー: ZenSky N のビルドに失敗しました。"; exit 1; fi
echo "--- ZenSky N のビルドが完了しました ---"

echo "--- PM2 のインストールとアプリケーションの起動を開始します ---"
npm install -g pm2
if [ $? -ne 0 ]; then echo "エラー: PM2 のインストールに失敗しました。"; exit 1; fi
pm2 start npm --name "zenskyn" -- start # package.json の "start" スクリプトを実行
if [ $? -ne 0 ]; then echo "エラー: PM2 で ZenSky N の起動に失敗しました。"; exit 1; fi
pm2 save --force # PM2 プロセスを保存し、再起動時に自動起動するように設定
pm2 startup # システム起動時にPM2が自動起動するように設定
echo "--- PM2 による ZenSky N の起動が完了しました ---"

echo "--- Nginx 設定ファイルの作成を開始します ---"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000; # ZenSky N が3000番ポートで動作すると仮定
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
if [ $? -ne 0 ]; then echo "エラー: Nginx 設定ファイルの作成に失敗しました。"; exit 1; fi
echo "--- Nginx 設定ファイルの作成が完了しました ---"

echo "--- Nginx 設定の有効化を開始します ---"
ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
if [ $? -ne 0 ]; then echo "エラー: Nginx 設定の有効化に失敗しました。"; exit 1; fi
nginx -t # 設定ファイルのテスト
if [ $? -ne 0 ]; then echo "エラー: Nginx 設定ファイルに構文エラーがあります。"; exit 1; fi
systemctl restart nginx # Nginx の再起動
if [ $? -ne 0 ]; then echo "エラー: Nginx の再起動に失敗しました。"; exit 1; fi
echo "--- Nginx 設定の有効化が完了しました ---"

echo "--- SSL 証明書の取得 (Let's Encrypt) を開始します ---"
# Certbot を使用して証明書を取得
# --nginx プラグインを使用し、Nginx の設定を自動的に更新
# --agree-tos 利用規約に同意
# --email メールアドレスを指定
# --non-interactive 非対話モード
certbot --nginx --agree-tos --email "$EMAIL" --non-interactive --domains "$DOMAIN"
if [ $? -ne 0 ]; then echo "エラー: SSL 証明書の取得に失敗しました。DNS設定を確認してください。"; exit 1; fi
echo "--- SSL 証明書の取得が完了しました ---"

echo "--- Nginx の最終設定と再起動 ---"
# Certbot がNginx設定を更新した後、Nginxを再起動してHTTPSを有効にする
systemctl restart nginx
if [ $? -ne 0 ]; then echo "エラー: Nginx の最終再起動に失敗しました。"; exit 1; fi

echo "--- ZenSky N セットアップ完了 ---"
echo "ZenSky N が https://$DOMAIN で動作しています。"
echo "PM2 プロセスを確認: pm2 list"
echo "Nginx アクセスログを確認: tail -f /var/log/nginx/access.log"
echo "アプリケーションログを確認: pm2 logs zenskyn"
