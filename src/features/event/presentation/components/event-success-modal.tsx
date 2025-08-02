"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, User, Palette, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import type { Event } from "../../event.interface";

interface EventSuccessModalProps {
  event: Event;
  onClose: () => void;
}

interface EventSuccessModalState {
  isOpen: boolean;
  event: Event | null;
  onClose: (() => void) | null;
}

// Global state for the modal
let modalState: EventSuccessModalState = {
  isOpen: false,
  event: null,
  onClose: null,
};

let setModalState: ((state: EventSuccessModalState) => void) | null = null;

export function EventSuccessModal() {
  const [state, setState] = useState<EventSuccessModalState>(modalState);

  // Register the state setter
  if (!setModalState) {
    setModalState = setState;
  }

  const handleClose = () => {
    if (state.onClose) {
      state.onClose();
    }
    
    const newState = { isOpen: false, event: null, onClose: null };
    modalState = newState;
    setState(newState);
  };

  if (!state.event) return null;

  const getColorInfo = (color: string) => {
    const colorMap = {
      blue: { label: "Azul", bgClass: "bg-blue-100", textClass: "text-blue-800", dotClass: "bg-blue-600" },
      green: { label: "Verde", bgClass: "bg-green-100", textClass: "text-green-800", dotClass: "bg-green-600" },
      red: { label: "Vermelho", bgClass: "bg-red-100", textClass: "text-red-800", dotClass: "bg-red-600" },
      yellow: { label: "Amarelo", bgClass: "bg-yellow-100", textClass: "text-yellow-800", dotClass: "bg-yellow-600" },
      purple: { label: "Roxo", bgClass: "bg-purple-100", textClass: "text-purple-800", dotClass: "bg-purple-600" },
      orange: { label: "Laranja", bgClass: "bg-orange-100", textClass: "text-orange-800", dotClass: "bg-orange-600" },
      gray: { label: "Cinza", bgClass: "bg-gray-100", textClass: "text-gray-800", dotClass: "bg-gray-600" },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const colorInfo = getColorInfo(state.event.color);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={state.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <AnimatePresence>
          {state.isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full"
                    >
                      <CheckCircle className="h-6 w-6" />
                    </motion.div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-white">
                        Evento Criado!
                      </DialogTitle>
                      <p className="text-green-100 text-sm">
                        Seu evento foi criado com sucesso
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="text-white hover:bg-white/20 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6 space-y-4">
                {/* Event Title */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {state.event.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {state.event.description}
                  </p>
                </div>

                <Separator />

                {/* Event Information */}
                <div className="space-y-3">
                  {/* Date and Time */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Data e Hora</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(state.event.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Horário</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(state.event.startDate), "HH:mm")} às{" "}
                        {format(new Date(state.event.endDate), "HH:mm")}
                      </p>
                    </div>
                  </div>

                  {/* Assigned User */}
                  {state.event.user && (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={state.event.user.picturePath || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(state.event.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Funcionário</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {state.event.user.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Event Color */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <Palette className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cor</p>
                      <Badge className={`${colorInfo.bgClass} ${colorInfo.textClass} border-0`}>
                        <div className={`w-2 h-2 rounded-full ${colorInfo.dotClass} mr-2`} />
                        {colorInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 cursor-pointer"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Perfeito!
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Static methods for controlling the modal
EventSuccessModal.show = (props: EventSuccessModalProps) => {
  const newState = {
    isOpen: true,
    event: props.event,
    onClose: props.onClose,
  };
  modalState = newState;
  if (setModalState) {
    setModalState(newState);
  }
};

EventSuccessModal.hide = () => {
  const newState = { isOpen: false, event: null, onClose: null };
  modalState = newState;
  if (setModalState) {
    setModalState(newState);
  }
};