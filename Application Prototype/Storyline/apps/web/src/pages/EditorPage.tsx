import { useParams } from 'react-router-dom';
import { Editor } from '@components/editor/Editor';
import { DocumentSidebar } from '@components/sidebar/DocumentSidebar';
import { useState } from 'react';

export function EditorPage() {
  const { documentId } = useParams();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex h-full">
      {showSidebar && (
        <DocumentSidebar 
          documentId={documentId} 
          onClose={() => setShowSidebar(false)}
        />
      )}
      
      <div className="flex-1">
        <Editor 
          documentId={documentId}
          initialContent=""
          onContentChange={(content) => {
            // Handle content changes
            console.log('Content changed:', content.length);
          }}
        />
      </div>
    </div>
  );
}