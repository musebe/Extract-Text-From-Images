import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Extract Text From Images Using Tesseract.js</title>
        <meta
          name="description"
          content="Extract Text From Images Using Tesseract.js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <ul>
          <li>
            <Link href="/">
              <a>Home</a>
            </Link>
          </li>
          <li>
            <Link href="/images">
              <a>Images</a>
            </Link>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
      <style jsx>{`
        nav {
          min-height: 100px;
          background-color: #fafafa;
          display: flex;
          align-items: center;
        }

        nav > ul {
          display: flex;
          justify-content: flex-end;
          height: 100%;
          width: 100%;
          padding-right: 50px;
          list-style: none;
        }

        nav > ul > li {
          margin: 0 10px;
        }

        nav > ul > li > a {
          padding: 10px 20px;
          background-color: #7811ff;
          color: #ffffff;
          font-weight: bold;
          border-radius: 5px;
        }

        nav > ul > li > a:hover {
          background-color: #5d1bb4;
        }

        main {
          min-height: calc(100vh - 100px);
        }
      `}</style>
    </div>
  );
}
