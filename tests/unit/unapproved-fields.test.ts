/**
 * Guard against modelling unapproved product decisions (ADR-0005;
 * OPEN-DECISIONS #8, #15–#20): sold-out, capacity, rooms, passports,
 * audience types, refunds, invoices, participant limits.
 */
import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Events } from '@/cms/collections/Events'
import { Lessons } from '@/cms/collections/Lessons'
import { Pages } from '@/cms/collections/Pages'
import { Parashot } from '@/cms/collections/Parashot'
import { Team } from '@/cms/collections/Team'
import { Testimonials } from '@/cms/collections/Testimonials'
import { Topics } from '@/cms/collections/Topics'
import { Trips } from '@/cms/collections/Trips'

const FORBIDDEN = /sold|capacity|room|passport|audience|refund|invoice|participant|waitlist|waiting/i

function fieldNames(fields: Field[]): string[] {
  const names: string[] = []
  for (const field of fields) {
    if ('name' in field && field.name) names.push(field.name)
    if ('fields' in field && Array.isArray(field.fields)) names.push(...fieldNames(field.fields))
    if ('tabs' in field) for (const tab of field.tabs) names.push(...fieldNames(tab.fields))
    if ('blocks' in field) for (const block of field.blocks) names.push(...fieldNames(block.fields))
  }
  return names
}

describe('no unapproved booking fields (T09)', () => {
  it.each([Trips, Events, Parashot, Lessons, Topics, Testimonials, Team, Pages].map((c) => [c.slug, c]))(
    '%s has no sold-out / capacity / room / passport / audience / refund / invoice fields',
    (_slug, collection) => {
      const names = fieldNames(collection.fields)
      expect(names.length).toBeGreaterThan(0)
      expect(names.filter((n) => FORBIDDEN.test(n))).toEqual([])
    },
  )

  it('registration offers "onsite" only as a reserved, rejected value', async () => {
    const { ACTIVE_REGISTRATION_MODES, REGISTRATION_MODES } = await import('@/cms/fields/registration')
    expect(REGISTRATION_MODES).toContain('onsite')
    expect(ACTIVE_REGISTRATION_MODES).not.toContain('onsite')
    expect(ACTIVE_REGISTRATION_MODES[0]).toBe('none')
  })
})
