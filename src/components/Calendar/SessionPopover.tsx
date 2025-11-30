import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, CheckCircle2, Edit3, Trash2 } from "lucide-react";
import type { ReviewSessionDto } from "@/types";

interface SessionPopoverProps {
  session: ReviewSessionDto;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
  trigger: React.ReactNode;
}

/**
 * Session Popover component with quick actions
 *
 * Displays on hover/click over SessionCardMini
 * Provides quick access to:
 * - View Details (navigate to session detail page)
 * - Quick Complete (mark as completed - pending sessions only)
 * - Edit (open edit modal)
 * - Delete (with confirmation dialog)
 *
 * @example
 * <SessionPopover
 *   session={sessionDto}
 *   onQuickComplete={completeSession}
 *   onEdit={openEditModal}
 *   onDelete={deleteSession}
 *   trigger={<SessionCardMini {...props} />}
 * />
 */
export function SessionPopover({ session, onQuickComplete, onEdit, onDelete, trigger }: SessionPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isCompleted = session.isCompleted;

  const handleViewDetails = () => {
    setIsPopoverOpen(false);
    window.location.href = `/app/review-sessions/${session.id}`;
  };

  const handleQuickComplete = async () => {
    try {
      setIsCompleting(true);
      await onQuickComplete(session.id);
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Failed to complete session:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEdit = () => {
    setIsPopoverOpen(false);
    onEdit(session.id);
  };

  const handleDeleteClick = () => {
    setIsPopoverOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await onDelete(session.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start" side="right">
          <div className="flex flex-col gap-1">
            {/* View Details */}
            <Button variant="ghost" size="sm" className="justify-start gap-2 h-9" onClick={handleViewDetails}>
              <Eye className="h-4 w-4" />
              View Details
            </Button>

            {/* Quick Complete - only for pending sessions */}
            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-9"
                onClick={handleQuickComplete}
                disabled={isCompleting}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isCompleting ? "Completing..." : "Mark as Completed"}
              </Button>
            )}

            {/* Edit */}
            <Button variant="ghost" size="sm" className="justify-start gap-2 h-9" onClick={handleEdit}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>

            <Separator className="my-1" />

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{session.exerciseLabel}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
