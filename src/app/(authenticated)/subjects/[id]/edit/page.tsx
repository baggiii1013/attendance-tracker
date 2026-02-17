import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import Subject from "@/lib/db/models/Subject";
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

  return (
    <SubjectForm
      initialData={{
        _id: subject._id.toString(),
        name: subject.name,
        startTime: subject.startTime,
        endTime: subject.endTime,
        activeDays: subject.activeDays,
        color: subject.color,
      }}
    />
  );
}
