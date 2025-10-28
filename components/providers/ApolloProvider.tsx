'use client'

/**
 * Apollo Client Provider
 */

import { ApolloProvider as BaseApolloProvider } from '@apollo/client'
import { apolloClient } from '@/lib/apollo-client'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ApolloProvider({ children }: Props) {
  return <BaseApolloProvider client={apolloClient}>{children}</BaseApolloProvider>
}
