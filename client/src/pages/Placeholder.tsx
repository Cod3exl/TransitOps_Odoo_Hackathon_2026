import { Card } from "../components/ui";

export default function Placeholder({ title, owner }: { title: string; owner: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <Card className="mt-6 p-10 text-center text-slate-400">
        <div className="text-4xl">🚧</div>
        <p className="mt-3 text-sm">
          {title} page is owned by <span className="font-medium text-slate-600">{owner}</span> and is not
          wired up yet.
        </p>
      </Card>
    </div>
  );
}
