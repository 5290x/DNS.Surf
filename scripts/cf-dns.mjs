import Cloudflare from 'cloudflare'
import { CLOUDFLARE_REGIONS } from '../config/cloudflare'

const WORKER_HOST = process.env.WORKER_HOST

const cloudflare = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
})

async function updateDNS(existingRecords, dnsName, ip) {
  const existingRecord = existingRecords.find(record => record.name === dnsName)
  if (existingRecord) {
    console.info(`updating ${dnsName} to ${ip}`)
    await cloudflare.dns.records.update(existingRecord.id, {
      zone_id: process.env.CLOUDFLARE_ZONE_ID,
      proxied: true,
      name: dnsName,
      type: 'A',
      content: ip,
    })
  }
  else {
    console.info(`creating ${dnsName} with ${ip}`)
    await cloudflare.dns.records.create({
      zone_id: process.env.CLOUDFLARE_ZONE_ID,
      proxied: true,
      name: dnsName,
      type: 'A',
      content: ip,
    })
  }
}

async function main() {
  const { result: existingRecords = [] } = await cloudflare.dns.records.list({
    zone_id: process.env.CLOUDFLARE_ZONE_ID,
    per_page: 5000000,
    type: 'A',
    search: WORKER_HOST,
  })

  for (const region in CLOUDFLARE_REGIONS) {
    const dnsName = `${region}.${WORKER_HOST}`
    await updateDNS(existingRecords, dnsName, CLOUDFLARE_REGIONS[region].ip)
  }
}

main()
