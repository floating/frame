// import React from 'react'
// import Restore from 'react-restore'

// import svg from '../../../../../resources/svg'
// import link from '../../../../../resources/link'

// class Network extends React.Component {
//   constructor (...args) {
//     super(...args)
//     const { id, name, type, explorer, symbol } = this.props
//     this.state = { id, name, explorer, type, symbol, submitted: false }
//   }

//   render () {
//     const changed = (
//       this.props.id !== this.state.id ||
//       this.props.name !== this.state.name ||
//       this.props.symbol !== this.state.symbol ||
//       this.props.explorer !== this.state.explorer ||
//       this.props.type !== this.state.type
//     )
//     return (
//       <div className='phaseNetworkLine'>
//         {changed ? (
//           <div
//             className='phaseNetworkSubmit phaseNetworkSubmitEnabled' onMouseDown={() => {
//               const net = { id: this.props.id, name: this.props.name, type: this.props.type, symbol: this.props.symbol, explorer: this.props.explorer }
//               const newNet = { id: this.state.id, name: this.state.name, type: this.state.type, symbol: this.state.symbol, explorer: this.state.explorer }
//               this.setState({ submitted: true })
//               link.send('tray:action', 'updateNetwork', net, newNet)
//               setTimeout(() => this.setState({ submitted: false }), 1600)
//             }}
//           >
//             {svg.save(16)}
//           </div>
//         ) : (this.state.submitted ? (
//           <div className='phaseNetworkSubmit phaseNetworkSubmitted'>
//             {svg.octicon('check', { height: 22 })}
//           </div>
//         ) : (
//           <div
//             className='phaseNetworkSubmit phaseNetworkRemove' onMouseDown={() => {
//               const { id, name, type, explorer } = this.props
//               link.send('tray:action', 'removeNetwork', { id, name, explorer, type })
//             }}
//           >
//             {svg.trash(16)}
//           </div>
//         )
//         )}
//         <div className='phaseNetworkName'>
//           <input
//             value={this.state.name} spellCheck='false'
//             onChange={(e) => {
//               this.setState({ name: e.target.value })
//             }}
//             onBlur={(e) => {
//               if (e.target.value === '') this.setState({ name: this.props.name })
//             }}
//           />
//         </div>
//         <div className='phaseNetworkSymbol'>
//           <input
//             value={this.state.symbol} spellCheck='false'
//             onChange={(e) => {
//               if (e.target.value.length > 8) return e.preventDefault()
//               this.setState({ symbol: e.target.value })
//             }}
//             onBlur={(e) => {
//               if (e.target.value === '') this.setState({ symbol: this.props.symbol })
//             }}
//           />
//         </div>
//         <div className='phaseNetworkId'>
//           <input
//             value={this.state.id} spellCheck='false'
//             onChange={(e) => {
//               this.setState({ id: e.target.value })
//             }}
//             onBlur={(e) => {
//               if (e.target.value === '') this.setState({ id: this.props.id })
//             }}
//           />
//         </div>
//         <div className='phaseNetworkExplorer'>
//           <input
//             value={this.state.explorer} spellCheck='false'
//             onChange={(e) => {
//               this.setState({ explorer: e.target.value })
//             }}
//             onBlur={(e) => {
//               if (e.target.value === '') this.setState({ explorer: this.props.explorer })
//             }}
//           />
//         </div>
//       </div>
//     )
//   }
// }

// export default Restore.connect(NetworkWrap)
