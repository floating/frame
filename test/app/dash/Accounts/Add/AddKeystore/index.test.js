it('Should update the navigation to view the newly created account', async () => {
  const { user, getAllByRole } = setupComponent(
    <AddKeystore
      accountData={{ secret: keystore, password: signerPassword, creationArgs: [keystorePassword] }}
    />
  )
  const confirmInput = getAllByRole('textbox')[1]
  const confirmButton = getAllByRole('button')[2]
  link.rpc.mockImplementationOnce((action, secret, passwd, keystorePsswd, cb) => {
    cb(null, { id: '1234' })
  })

  await user.type(confirmInput, signerPassword)

  act(() => {
    jest.runAllTimers()
  })
  await user.click(confirmButton)
  expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
    view: 'expandedSigner',
    data: { signer: '1234' }
  })
})
