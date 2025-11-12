import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export const Stepper = ({ steps, currentStep, onStepClick }: StepperProps) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const stepNumber = index + 1;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className="flex flex-col items-center relative z-10 cursor-pointer hover:scale-105 transition-transform"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  isCompleted &&
                    "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]",
                  isCurrent &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.6)] scale-110",
                  !isCompleted && !isCurrent && "bg-card border-2 border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent && "text-foreground",
                    !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
