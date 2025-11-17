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
  onNext: (
    title: string,
    description: string,
    location: string,
    dateFrom: string,
    dateTo: string
  ) => void;
  selectedTheme?: string;
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

  // Date handling
  const parseMonth = (dateStr: string) => {
    if (!dateStr) return { year: "", month: "" };
    const clean = dateStr.includes(" - ")
      ? dateStr.split(" - ")[0]
      : dateStr;
    const parts = clean.split("-");
    return { year: parts[0] || "", month: parts[1] || "" };
  };

  const parsed = parseMonth(initialDate);
  const [year, setYear] = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);

  const handleNext = () => {
    if (title.trim()) {
      const dateStr = year && month ? `${year}-${month}` : "";
      onNext(title, description, location, dateStr, "");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card rounded-lg border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary/10 rounded-full mb-2">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">New Video Project</h2>
          <p className="text-muted-foreground">
            Enter your video title and details
          </p>
        </div>

        <div className="space-y-4">

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Video Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Vacation 2024"
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short description..."
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Budapest, Hungary"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Continue */}
        <Button
          onClick={handleNext}
          disabled={!title.trim()}
          className="w-full"
          size="lg"
        >
          Continue to Images
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
