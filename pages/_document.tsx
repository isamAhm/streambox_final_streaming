import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/images/favicon1.png" />

          {/* Security meta tags */}
          <meta name="referrer" content="no-referrer" />

          {/* Disable text selection and copying in production */}
          {process.env.NODE_ENV === 'production' && (
            <style dangerouslySetInnerHTML={{
              __html: `
                * {
                  -webkit-user-select: none;
                  -moz-user-select: none;
                  -ms-user-select: none;
                  user-select: none;
                }
                input, textarea {
                  -webkit-user-select: text;
                  -moz-user-select: text;
                  -ms-user-select: text;
                  user-select: text;
                }
              `
            }} />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />

          {/* Additional protection script */}
          {process.env.NODE_ENV === 'production' && (
            <script dangerouslySetInnerHTML={{
              __html: `
                // Disable drag and drop
                document.addEventListener('dragstart', function(e) {
                  e.preventDefault();
                  return false;
                });
                
                // Disable text selection on images
                document.addEventListener('selectstart', function(e) {
                  if (e.target.tagName === 'IMG') {
                    e.preventDefault();
                    return false;
                  }
                });
                
                // Clear console on load
                if (typeof console !== 'undefined') {
                  console.clear();
                }
              `
            }} />
          )}
        </body>
      </Html>
    )
  }
}

export default MyDocument
