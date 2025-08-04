import { useRef, useEffect } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { useEditorStore } from '@stores/editorStore';
import { Toolbar } from '../toolbar/Toolbar';
import { useDebounce } from '@hooks/useDebounce';
import toast from 'react-hot-toast';

interface EditorProps {
  documentId?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

export function Editor({ 
  documentId, 
  initialContent = '', 
  onContentChange,
  readOnly = false 
}: EditorProps) {
  const editorRef = useRef<any>(null);
  const { content, setContent, saveStatus, setSaveStatus } = useEditorStore();
  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent, setContent]);

  useEffect(() => {
    if (debouncedContent && documentId && !readOnly) {
      setSaveStatus('saving');
      // Auto-save logic would go here
      // For now, just simulate saving
      setTimeout(() => {
        setSaveStatus('saved');
        onContentChange?.(debouncedContent);
      }, 500);
    }
  }, [debouncedContent, documentId, onContentChange, setSaveStatus, readOnly]);

  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
    setSaveStatus('unsaved');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <Toolbar editorRef={editorRef} />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <TinyMCEEditor
            onInit={(evt, editor) => editorRef.current = editor}
            value={content}
            onEditorChange={handleEditorChange}
            disabled={readOnly}
            init={{
              height: '100%',
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
                'autosave', 'directionality', 'emoticons', 'template', 'codesample'
              ],
              toolbar: false, // We're using our custom toolbar
              content_style: `
                body { 
                  font-family: 'Merriweather', serif; 
                  font-size: 16px;
                  line-height: 1.8;
                  color: #1a1a1a;
                  max-width: 100%;
                  margin: 0;
                  padding: 0;
                }
                p { margin: 1em 0; }
                h1 { font-size: 2.5em; margin: 0.67em 0; }
                h2 { font-size: 2em; margin: 0.75em 0; }
                h3 { font-size: 1.5em; margin: 0.83em 0; }
                h4 { font-size: 1.17em; margin: 1em 0; }
                h5 { font-size: 1em; margin: 1.33em 0; }
                h6 { font-size: 0.83em; margin: 1.67em 0; }
              `,
              skin: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide',
              content_css: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
              autosave_interval: '30s',
              autosave_prefix: `storyline_draft_${documentId}_`,
              autosave_retention: '30m',
              paste_data_images: true,
              automatic_uploads: true,
              file_picker_types: 'image',
              images_upload_handler: async (blobInfo: any) => {
                // Implement your image upload logic here
                return new Promise((resolve, reject) => {
                  // Simulate upload
                  setTimeout(() => {
                    resolve(`/api/images/${blobInfo.filename()}`);
                  }, 1000);
                });
              },
            }}
          />
        </div>
      </div>

      {/* Save status indicator */}
      <div className="absolute bottom-4 right-4 text-sm text-gray-500">
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'All changes saved'}
        {saveStatus === 'unsaved' && 'Unsaved changes'}
      </div>
    </div>
  );
}