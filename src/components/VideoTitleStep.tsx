import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowRight, Film } from "lucide-react";

interface VideoTitleStepProps {
  initialTitle?: string;
  initialDescription?: string;
  initialLocation?: string;
  initialDate?: string;
  onNext: (title: string, description: string, location: string, dateFrom: string, dateTo: string) => void;
}

export const VideoTitleStep = ({
  initialTitle = "",
  initialDescription = "",
  initialLocation = "",
  initialDate = "",
  onNext,
}: VideoTitleStepProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  
  // Parse initial date - format is "YYYY-MM"
  const parseMonth = (dateStr: string) => {
    if (!dateStr) return { year: "", month: "" };
    const cleanDate = dateStr.includes(" - ") ? dateStr.split(" - ")[0] : dateStr;
    const parts = cleanDate.split("-");
    return { year: parts[0] || "", month: parts[1] || "" };
  };
  
  const parsedDate = parseMonth(initialDate);
  const [year, setYear] = useState(parsedDate.year);
  const [month, setMonth] = useState(parsedDate.month);

  const handleNext = () => {
    if (title.trim()) {
      const dateStr = year && month ? `${year}-${month}` : "";
      onNext(title, description, location, dateStr, "");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = [
    { value: "01", label: "Január" },
    { value: "02", label: "Február" },
    { value: "03", label: "Március" },
    { value: "04", label: "Április" },
    { value: "05", label: "Május" },
    { value: "06", label: "Június" },
    { value: "07", label: "Július" },
    { value: "08", label: "Augusztus" },
    { value: "09", label: "Szeptember" },
    { value: "10", label: "Október" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary/10 rounded-full mb-2">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Új videó projekt</h2>
          <p className="text-muted-foreground">
            Add meg a videód címét és egy rövid leírást
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Videó címe *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pl. Nyári vakáció 2024"
              className="text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Leírás (opcionális)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Írj egy rövid leírást a videóról..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Helyszín (opcionális)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="pl. Budapest, Magyarország"
            />
          </div>

          <div className="space-y-2">
            <Label>Időpont (opcionális)</Label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Év</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Hónap</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Button
          onClick={handleNext}
          disabled={!title.trim()}
          size="lg"
          className="w-full gap-2"
        >
          Tovább a fájlok feltöltéséhez
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
