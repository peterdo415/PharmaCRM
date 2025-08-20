# PharmaCRM

PharmaCRM は薬局向けの CRM システムです。Supabase を利用した認証・データ管理と、React + TypeScript + Tailwind CSS によるモダンな UI を備えています。

## 技術スタック
- **フロントエンド**: React 18, TypeScript, Vite, React Router
- **状態管理**: Zustand
- **フォーム / バリデーション**: React Hook Form, Zod
- **UI**: Tailwind CSS, Headless UI, Lucide Icons
- **バックエンド / 認証**: Supabase
- **テスト**: Playwright（今後作成予定）
- **開発ツール**: ESLint, Prettier

## 主な機能
- 薬局管理者と薬剤師のユーザー管理
- ダッシュボードでの統計やお知らせ表示
- 薬剤師のスケジュール・シフト管理
- プロファイル編集機能
- 今後の機能として勤務実績やレポート作成を予定

## 開発
```bash
npm install
npm run dev
```

ローカルの開発サーバーが起動し、`http://localhost:5173` でアプリケーションを確認できます。

## CI/CD
GitHub Actions のデプロイワークフローは `main` ブランチへの push をトリガーに動作し、Supabase CLI の `supabase db push` によってデータベースを自動更新した後、Vercel にデプロイします。
