export function sendMarketing(address: string) {
  return { to: address, html: "<a href='/unsubscribe'>unsubscribe</a>" };
}
