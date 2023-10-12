import React, { Fragment } from "react";
import type { GetStaticPathsResult, GetStaticPropsContext } from "next";
import Link from "next/link";
import type { DocumentRendererProps } from "@keystone-6/document-renderer";
import { DocumentRenderer } from "@keystone-6/document-renderer";
import { fetchGraphQL, gql } from "../../graphql";

export type DocumentProp = DocumentRendererProps["document"];

type Post = {
  id: string;
  title: string;
  author: {
    name: string;
  } | null;
  content: {
    document: DocumentProp;
  };
};

export default function BlogPage({ post, error }: { post: Post | undefined; error?: Error }) {
  if (error) {
    return (
      <Fragment>
        <h1>Something went wrong</h1>
        <pre>{error.message}</pre>
      </Fragment>
    );
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <main>
      <div>
        <Link href="/">&larr; Back to Home</Link>
      </div>
      <article>
        <h1>{post.title}</h1>
        <p>
          {post.author?.name ? (
            <span>
              <em>By {post.author.name}</em>
            </span>
          ) : null}
        </p>
        <DocumentRenderer document={post.content.document} />
      </article>
    </main>
  );
}

export async function getStaticPaths() {
  // Fetch a list of known post IDs
  const data = await fetchGraphQL(
    gql`
      query postIDs {
        posts {
          id
        }
      }
    `
  );

  const posts: { id: string }[] = data?.posts || [];
  const paths = posts.map(({ id }) => ({
    params: { id },
  }));

  return {
    paths,
    fallback: true, // Set to 'true' to enable 'fallback' behavior
  };
}

export async function getStaticProps({ params = {} }: GetStaticPropsContext) {
  const { id } = params;
  try {
    const data = await fetchGraphQL(
      gql`
        query post($id: ID!) {
          post(where: { id: $id }) {
            id
            title
            author {
              name
            }
            content {
              document
            }
          }
        }
      `,
      {
        id,
      }
    );

    const post = data?.post || null;
    return { props: { post } };
  } catch (e) {
    return {
      props: {
        post: null,
        error: { name: (e as Error).name, message: (e as Error).message },
      },
    };
  }
}