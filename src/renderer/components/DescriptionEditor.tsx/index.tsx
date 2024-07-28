import { EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import { Box, useTheme } from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Code from '../../icons/Code';
import CodeBlock from '../../icons/CodeBlock';

import './style.css';

interface DescriptionEditorProps {
  editor: Editor | null;
}

function DescriptionEditor({ editor }: DescriptionEditorProps) {
  const theme = useTheme();

  return (
    <Box mt={2}>
      <EditorContent
        style={{
          border: editor?.isFocused
            ? `1px solid ${theme.palette.primary.main}`
            : '1px solid #eee',
          borderRadius: '4px',
        }}
        editor={editor}
      />
      <BubbleMenu className="bubble-menu" editor={editor}>
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'is-active' : ''}
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'is-active' : ''}
          type="button"
          style={{
            fontFamily: 'Times new roman',
          }}
        >
          <em>I</em>
        </button>
        <button
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''
          }
          type="button"
        >
          H<span style={{ fontSize: '10px' }}>1</span>
        </button>
        <button
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''
          }
          type="button"
        >
          H<span style={{ fontSize: '10px' }}>2</span>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? 'is-active' : ''}
          type="button"
        >
          <FormatListBulletedIcon fontSize="small" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCode().run()}
          disabled={!editor?.can().chain().focus().toggleCode().run()}
          className={editor?.isActive('code') ? 'is-active' : ''}
          type="button"
          style={{ paddingInlineEnd: '4px', paddingInlineStart: '4px' }}
        >
          <Code />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={editor?.isActive('codeBlock') ? 'is-active' : ''}
          type="button"
          style={{ paddingInlineEnd: '2px', paddingInlineStart: '2px' }}
        >
          <CodeBlock />
        </button>
      </BubbleMenu>
    </Box>
  );
}

export default DescriptionEditor;
