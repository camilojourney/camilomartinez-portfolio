import Link from 'next/link'
import Image, { ImageProps } from 'next/image'
import { MDXRemote, type MDXRemoteProps } from 'next-mdx-remote/rsc'
import { highlight } from 'sugar-high'
import React, { ComponentProps } from 'react'

interface TableData {
  headers: string[];
  rows: string[][];
}

function Table({ data }: { data: TableData }) {
  let headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ))
  let rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ))

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

import { DetailedHTMLProps, AnchorHTMLAttributes } from 'react'

type CustomLinkProps = DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>

function CustomLink(props: CustomLinkProps) {
  const { href, ref: _ref, ...rest } = props

  if (href?.startsWith('/')) {
    return (
      <Link href={href} {...rest}>
        {props.children}
      </Link>
    )
  }

  if (href?.startsWith('#')) {
    return <a {...props} />
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />
}

function RoundedImage(props: ImageProps) {
  const { alt, ...rest } = props
  return <Image alt={alt || ''} className="rounded-lg" {...rest} />
}

function Code(props: { children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const { children, ...rest } = props
  if (typeof children !== 'string') return null
  let codeHTML = highlight(children)
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...rest} />
}

function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    let slug = slugify(children?.toString() || '')
    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement('a', {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor',
        }),
      ],
      children
    )
  }

  Heading.displayName = `Heading${level}`

  return Heading
}

type ComponentType = React.ComponentType<any>;
type MDXComponentsType = {
  [key: string]: ComponentType;
};

const mdxComponents: MDXComponentsType = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  img: RoundedImage as ComponentType,
  a: CustomLink as ComponentType,
  code: Code as ComponentType,
  Table: Table as ComponentType,
};

export function CustomMDX(props: MDXRemoteProps) {
  const { components: userComponents, ...rest } = props;
  return (
    <MDXRemote
      {...rest}
      components={{ ...mdxComponents, ...(userComponents || {}) }}
    />
  )
}
