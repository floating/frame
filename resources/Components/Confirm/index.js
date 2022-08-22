import React from 'react'

export default function ConfirmDialog ({ prompt, acceptText = 'OK', rejectText = 'Decline', onAccept, onDecline }) {
  return (
    <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
      <div className='notifyBoxSlide'></div>

      <div className='confirmText'>{prompt}</div>
      <div
            className='approveTransactionWarningProceed'
            onClick={() => this.props.onApprove(this.props.req, this.props.approval.type)}
          >
            Proceed
          </div>

          <div className='requestApprove'>
            <div 
              className='requestDecline' 
              onClick={() => { if (this.state.allowInput) link.send('tray:resolveRequest', this.props.req)
            }}>
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div 
              className='requestSign' 
              onClick={() => { if (this.state.allowInput) this.store.notify('addChain', this.props.req) 
            }}>
              <div className='requestSignButton _txButton'>Review</div>
            </div>
          </div>

      <div className='confirmButtonOptions'>
        <div role='button' className='confirmRejectButton'>
          {rejectText}
        </div>

        <div role='button' className='confirmRejectButton'>
          {acceptText}
        </div>
      </div>
    </div>
  )
}
