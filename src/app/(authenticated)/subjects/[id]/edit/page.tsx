import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import Subject, { IScheduleEntry, IScheduleSlot } from "@/lib/db/models/Subject";
import { notFound } from "next/navigation";
import SubjectForm from "../../new/SubjectForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSubjectPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();
  const subject = await Subject.findOne({
    _id: id,
    userId: session.user.id,
  }).lean();

  if (!subject) {
    notFound();
  }

  // Get the current active schedule's slots
  const currentSchedule = (subject.schedules || []).find(
    (s: IScheduleEntry) => s.effectiveTo === null
  );
  const slots = currentSchedule
    ? currentSchedule.slots.map((s: IScheduleSlot) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    : [{ day: "Mon", startTime: "09:00", endTime: "10:30" }];

  return (
    <SubjectForm
      initialData={{
        _id: subject._id.toString(),
        name: subject.name,
        slots,
        color: subject.color,
      }}
    />
  );
}
