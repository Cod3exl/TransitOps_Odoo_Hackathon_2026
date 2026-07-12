import { CreateTripForm } from "./CreateTripForm";
import { LiveBoard } from "./LiveBoard";

export default function Dispatcher() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dispatch</h1>
      <CreateTripForm />
      <LiveBoard />
    </div>
  );
}
