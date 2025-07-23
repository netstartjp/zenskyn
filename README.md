# ZenSky N デプロイメントガイド (Ubuntu)

このガイドは、ZenSky N アプリケーションを Ubuntu サーバーにデプロイし、Nginx をリバースプロキシとして使用して Let's Encrypt の SSL 証明書で HTTPS 経由で公開するための手順を説明します。

`setupfull.sh` スクリプトは、このプロセスを自動化します。

## 前提条件

*   **Ubuntu サーバー**: バージョン 20.04 LTS 以降を推奨します。
*   **SSH アクセス**: サーバーへの SSH アクセス権限が必要です。
*   **ドメイン名**: ZenSky N を公開するドメイン名（例: `zenskyn.example.com`）が必要です。
*   **DNS 設定**: ドメイン名の A レコードが、サーバーのパブリック IP アドレスを指すように設定されている必要があります。Certbot が証明書を発行するために必要です。
*   **ポート開放**: サーバーのファイアウォールでポート 80 (HTTP) と 443 (HTTPS) が外部からアクセス可能になっている必要があります。

## スクリプトの使用方法

1.  **サーバーに ZenSky N のソースコードを配置する**

    このスクリプトは、ZenSky N のソースコードが `/var/www/zenskyn` ディレクトリに存在することを前提としています。
    事前に、以下のいずれかの方法でソースコードをサーバーに配置してください。

    *   **Git を使用する場合**:
        ```bash
        sudo mkdir -p /var/www/zenskyn
        sudo chown -R $(whoami):$(whoami) /var/www/zenskyn # 権限を一時的に付与
        git clone <あなたのZenSky NリポジトリのURL> /var/www/zenskyn
        # 必要であれば、再度権限をrootに戻すか、スクリプト内で調整
        ```
    *   **ローカルからファイルを転送する場合 (例: scp)**:
        ```bash
        scp -r /path/to/your/zenskyn_project user@your_server_ip:/var/www/zenskyn
        ```
    *   **tar.gz などで固めて転送する場合**:
        ```bash
        tar -czvf zenskyn.tar.gz /path/to/your/zenskyn_project
        scp zenskyn.tar.gz user@your_server_ip:/var/www/
        # サーバー側で展開
        sudo tar -xzvf /var/www/zenskyn.tar.gz -C /var/www/
        sudo mv /var/www/zenskyn_project_extracted_folder /var/www/zenskyn
        ```

2.  **`setupfull.sh` スクリプトをサーバーにアップロードする**

    ローカルマシンでこの `README.md` と同じディレクトリに `setupfull.sh` を保存し、サーバーに転送します。

    ```bash
    scp setupfull.sh user@your_server_ip:~/
    ```

3.  **スクリプトに実行権限を付与する**

    サーバーに SSH で接続し、スクリプトに実行権限を付与します。

    ```bash
    chmod +x setupfull.sh
    ```

4.  **スクリプトを実行する**

    `sudo` を使用してスクリプトを実行します。`<your_domain.com>` を ZenSky N を公開する実際のドメイン名に、`<your_email@example.com>` を有効なメールアドレスに置き換えてください。

    ```bash
    sudo ./setupfull.sh your_domain.com your_email@example.com
    ```

    **例:**
    ```bash
    sudo ./setupfull.sh zenskyn.example.com admin@zenskyn.example.com
    ```

    スクリプトは、各ステップの進行状況とエラーメッセージを表示します。

## スクリプトの動作内容

`setupfull.sh` スクリプトは以下のタスクを自動的に実行します。

1.  **システム更新**: `apt update` と `apt upgrade` を実行し、システムを最新の状態に保ちます。
2.  **Node.js のインストール**: NodeSource を使用して、最新の LTS (Long Term Support) バージョンの Node.js をインストールします。
3.  **Nginx のインストール**: `nginx-full` パッケージをインストールします。
4.  **Certbot のインストール**: Let's Encrypt から SSL 証明書を取得するためのツール `certbot` と Nginx プラグインをインストールします。
5.  **ZenSky N のセットアップ**:
    *   `/var/www/zenskyn` ディレクトリを作成し、適切な権限を設定します。
    *   このディレクトリ内で `npm install` を実行して依存関係をインストールします。
    *   `npm run build` を実行してアプリケーションをビルドします。
6.  **PM2 のインストールと起動**:
    *   グローバルに PM2 (Node.js プロセス管理ツール) をインストールします。
    *   PM2 を使用して ZenSky N アプリケーションを起動し、システム起動時に自動的に起動するように設定します。
7.  **Nginx 設定ファイルの作成**:
    *   `/etc/nginx/sites-available/` ディレクトリに、指定されたドメイン名のリバースプロキシ設定ファイルを作成します。ZenSky N がデフォルトで 3000 番ポートで動作することを想定しています。
    *   この設定ファイルを `/etc/nginx/sites-enabled/` にシンボリックリンクを作成して有効化します。
8.  **SSL 証明書の取得**:
    *   Certbot の Nginx プラグインを使用して、指定されたドメイン名に対して Let's Encrypt から SSL 証明書を自動的に取得し、Nginx の設定を更新します。
9.  **Nginx の再起動**: すべての設定変更を適用するために Nginx サービスを再起動します。

## 重要な注意点

*   **DNS 設定**: スクリプトを実行する前に、必ずドメインの A レコードがサーバーのパブリック IP アドレスを指していることを確認してください。これが正しくないと、Certbot は証明書を発行できません。
*   **アプリケーションのソースコード**: スクリプトは、ZenSky N のソースコードが `/var/www/zenskyn` に配置されていることを前提としています。スクリプト実行前に手動で配置するか、スクリプト内に `git clone` コマンドを追加してください。
*   **ポート 3000**: ZenSky N がデフォルトで 3000 番ポートで動作することを想定しています。もし異なるポートを使用する場合は、Nginx 設定ファイル内の `proxy_pass` のポート番号を修正する必要があります。
*   **ファイアウォール**: サーバーのファイアウォール（例: UFW）が有効な場合、ポート 80 と 443 が開放されていることを確認してください。
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```
*   **セキュリティ**: このスクリプトは基本的なデプロイを自動化するためのものです。本番環境で使用する際は、より詳細な Nginx のセキュリティ設定、ログの監視、定期的な証明書の更新（Certbot は自動更新を設定しますが、確認は必要です）、サーバーのセキュリティ強化など、追加の対策を講じることを強く推奨します。
*   **エラーハンドリング**: スクリプトは基本的なエラーチェックを行いますが、すべてのエラーケースを網羅しているわけではありません。実行中にエラーが発生した場合は、表示されるエラーメッセージをよく読み、手動で対処する必要がある場合があります。
