import { useState } from 'react';
import { Dialog } from '@base-ui/react';
import { X } from 'lucide-react';

type CreateQuestionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (content: string) => void;
};

const CreateQuestionModal = ({
  open,
  onOpenChange,
  onCreate,
}: CreateQuestionModalProps) => {
  const [content, setContent] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setContent('');
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 text-left shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Create Question
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              autoFocus
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What's your question?"
              rows={4}
              className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={!content.trim()}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CreateQuestionModal;
