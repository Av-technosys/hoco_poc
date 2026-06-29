export default function ChatBubble({ message }) {
    const isUser = message.role === 'user';
    function cleanMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
            .replace(/\*(.*?)\*/g, '$1')        // italic
            .replace(/#{1,6}\s/g, '')           // headings
            .replace(/---/g, '')                // horizontal rules
            .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // code
            .replace(/^\s*[-•]\s/gm, '')        // dashes as bullets
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-1.5`}>
            {!isUser && (
                <img src="./hocco-logo.png" className="mt-1.5 size-9" />
            )}
            <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
                        ? 'bg-[#d9effd] text-gray-900 rounded-br-sm'
                        : 'bg-white text-black rounded-bl-sm border border-[#d9effd]'
                    }`}
            >
                {cleanMarkdown(message.content)}
                {message.streaming && (
                    <span className="inline-block w-2 h-4 bg-gray-300 ml-1 animate-pulse rounded-sm" />
                )}
            </div>
        </div>
    )
}