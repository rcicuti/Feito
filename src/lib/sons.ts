// Som curtinho e suave de conclusão, gerado no próprio aparelho (sem arquivos de áudio).
// Só toca se a pessoa ligou "Sons" nas configurações.
let ctx: AudioContext | null = null

export function tocarConclusao(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = ctx ?? new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const agora = ctx.currentTime
    ;[523.25, 783.99].forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const ganho = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = agora + i * 0.12
      ganho.gain.setValueAtTime(0, t)
      ganho.gain.linearRampToValueAtTime(0.08, t + 0.02) // volume baixo
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.connect(ganho).connect(ctx!.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  } catch {
    /* sem áudio: tudo bem */
  }
}
