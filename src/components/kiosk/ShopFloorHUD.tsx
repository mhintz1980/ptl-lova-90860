import { useState, useEffect } from "react";
import { UpNextSlide } from "./slides/UpNextSlide";
import { InventoryNudgeSlide } from "./slides/InventoryNudgeSlide";
import { ProgressSlide } from "./slides/ProgressSlide";

export function ShopFloorHUD() {
    const [slideIndex, setSlideIndex] = useState(0);
    const slides = [
        { id: "UP_NEXT", component: UpNextSlide },
        { id: "INVENTORY", component: InventoryNudgeSlide },
        { id: "PROGRESS", component: ProgressSlide },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % slides.length);
        }, 15000); // Rotate every 15 seconds
        return () => clearInterval(timer);
    }, [slides.length]);

    const CurrentSlide = slides[slideIndex].component;

    return (
        <div className="h-screen w-screen bg-background overflow-hidden">
            <CurrentSlide />

            {/* Progress Indicators */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                {slides.map((_, index) => (
                    <div
                        key={index}
                        className={`h-3 w-3 rounded-full transition-all duration-500 ${index === slideIndex ? "bg-primary w-8" : "bg-muted-foreground/30"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
