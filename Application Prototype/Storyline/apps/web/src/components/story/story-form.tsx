import { useActionState, useEffect, useRef } from "react"
import { createStory } from "src/app/actions/story-actions"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { Textarea } from "src/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert"
import { Terminal } from 'lucide-react'

export function StoryForm() {
  const [state, formAction, isPending] = useActionState(createStory, { message: "", errors: {} })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.message.includes("successfully")) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold">Create a New Story</h3>
      <div className="space-y-2">
        <Input name="title" placeholder="Story Title" required />
        {state.errors?.title && (
          <p className="text-sm text-red-500">{state.errors.title[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Textarea name="content" placeholder="Start your story here..." required />
        {state.errors?.content && (
          <p className="text-sm text-red-500">{state.errors.content[0]}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
      >
        {isPending ? "Creating..." : "Create Story"}
      </Button>

      {state.message && (
        <Alert variant={state.message.includes("successfully") ? "default" : "destructive"} className="mt-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>
            {state.message.includes("successfully") ? "Success" : "Error"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
