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
  
  // Parse initial date - format is "YYYY-MM" or "YYYY-MM - YYYY-MM"
  const parseMonth = (dateStr: string) => {
    if (!dateStr) return { year: "", month: "" };
    const parts = dateStr.split("-");
    return { year: parts[0] || "", month: parts[1] || "" };
  };
  
  const fromDate = parseMonth(initialDate.includes(" - ") ? initialDate.split(" - ")[0] : initialDate);
  const toDate = parseMonth(initialDate.includes(" - ") ? initialDate.split(" - ")[1] : "");
  
  const [yearFrom, setYearFrom] = useState(fromDate.year);
  const [monthFrom, setMonthFrom] = useState(fromDate.month);
  const [yearTo, setYearTo] = useState(toDate.year);
  const [monthTo, setMonthTo] = useState(toDate.month);

  const handleNext = () => {
    if (title.trim()) {
      const dateFromStr = yearFrom && monthFrom ? `${yearFrom}-${monthFrom}` : "";
      const dateToStr = yearTo && monthTo ? `${yearTo}-${monthTo}` : "";
      onNext(title, description, location, dateFromStr, dateToStr);
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
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Kezdő időpont</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Év</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={monthFrom}
                    onChange={(e) => setMonthFrom(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Hónap</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Befejező időpont (opcionális)</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Év</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={monthTo}
                    onChange={(e) => setMonthTo(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Hónap</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
