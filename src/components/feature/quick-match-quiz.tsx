'use client';
import { useState } from 'react';
import { Sparkles, Home, DollarSign, MapPin, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';

interface QuizQuestion {
  id: string;
  question: string;
  icon: React.ReactNode;
  options: { label: string; value: string; icon?: React.ReactNode }[];
}

const questions: QuizQuestion[] = [
  {
    id: 'type',
    question: 'What type of property are you looking for?',
    icon: <Home className="h-6 w-6" />,
    options: [
      { label: 'Apartment', value: 'APARTMENT' },
      { label: 'Villa', value: 'VILLA' },
      { label: 'House', value: 'HOUSE' },
      { label: 'Penthouse', value: 'PENTHOUSE' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your budget range?',
    icon: <DollarSign className="h-6 w-6" />,
    options: [
      { label: 'Under $100K', value: '0-100000' },
      { label: '$100K - $500K', value: '100000-500000' },
      { label: '$500K - $1M', value: '500000-1000000' },
      { label: '$1M+', value: '1000000-999999999' },
    ],
  },
  {
    id: 'location',
    question: 'Where would you like to live?',
    icon: <MapPin className="h-6 w-6" />,
    options: [
      { label: 'City Center', value: 'city' },
      { label: 'Suburbs', value: 'suburbs' },
      { label: 'Countryside', value: 'countryside' },
      { label: 'Waterfront', value: 'waterfront' },
    ],
  },
];

export function QuickMatchQuiz() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { setCurrentPage, setFilters } = useAppStore();

  const handleAnswer = (value: string) => {
    const questionId = questions[currentStep].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      // Quiz complete - apply filters and navigate
      setTimeout(() => {
        if (newAnswers.type) setFilters({ propertyType: newAnswers.type as any });
        if (newAnswers.budget) {
          const [min, max] = newAnswers.budget.split('-');
          setFilters({ priceMin: Number(min), priceMax: Number(max) });
        }
        setCurrentPage('search');
        setIsOpen(false);
      }, 500);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => { setIsOpen(true); resetQuiz(); }}
        className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
      >
        <Sparkles className="h-4 w-4" />
        Find My Perfect Property
      </Button>

      {/* Quiz Modal */}
      <>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            onClick={() => setIsOpen(false)}
          >
            <div className="w-full max-w-lg">
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden border-0 shadow-2xl">
                {/* Progress bar */}
                <div className="h-1 bg-muted">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400">
                    />
                <CardContent className="p-8">
                  {/* Step indicator */}
                  <div className="mb-6 text-center text-sm text-muted-foreground">
                    Question {currentStep + 1} of {questions.length}
                  </div>

                  {/* Question */}
                  <>
                    <div
                      key={currentStep}
                                            className="text-center"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600">
                        {questions[currentStep].icon}
                      </div>
                      <h2 className="mb-8 text-xl font-bold">{questions[currentStep].question}</h2>

                      <div className="space-y-3">
                        {questions[currentStep].options.map((option) => (
                          <button
                            key={option.value}
                                                        className={`w-full rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
                              answers[questions[currentStep].id] === option.value
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-800'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between">
                    {currentStep > 0 ? (
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={resetQuiz}>
                      <RotateCcw className="mr-1 h-4 w-4" /> Restart>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </>
    </>
  );
}
