import { useRouter } from "next/router";
import { useEffect } from "react";
import { ClipPreview } from "@/components/Edit/ClipPreview";
import { TimelineEditor } from "@/components/Edit/TimelineEditor";
import { TextOverlayEditor } from "@/components/Edit/TextOverlayEditor";
import { TransitionsEditor } from "@/components/Edit/TransitionsEditor";
import { ThemesSelector } from "@/components/Edit/ThemesSelector";
import { AiAutoCut } from "@/components/Edit/AiAutoCut";

export default function EditPage() {
  const router = useRouter();

  // Ha nincsenek előző lépések adatai, visszaküldi a kezdőlapra
  useEffect(() => {
    // Később ide jön a globális state ellenőrzése (videos, title, stb.)
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT COLUMN – LARGE CLIP PREVIEW */}
        <div className="space-y-6">
          <ClipPreview />
        </div>

        {/* RIGHT COLUMN – ALL EDIT PANELS */}
        <div className="space-y-6">

          <TimelineEditor />

          <TextOverlayEditor />

          <TransitionsEditor />

          <AiAutoCut />

          <ThemesSelector />

        </div>
      </div>
    </div>
  );
}
