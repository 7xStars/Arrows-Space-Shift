param([string]$Output = 'reports/mute-investigation/host-audio.json')
$ErrorActionPreference = 'Stop'
$source = @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace AssHostAudioRead {
[ComImport,Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class DeviceEnumeratorCom {}
[ComImport,Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IDeviceEnumerator {
 [PreserveSig]int EnumAudioEndpoints(int flow,uint mask,out IDeviceCollection devices);
 [PreserveSig]int GetDefaultAudioEndpoint(int flow,int role,out IDevice device);
 [PreserveSig]int GetDevice([MarshalAs(UnmanagedType.LPWStr)]string id,out IDevice device);
}
[ComImport,Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IDeviceCollection {
 [PreserveSig]int GetCount(out uint count); [PreserveSig]int Item(uint index,out IDevice device);
}
[ComImport,Guid("D666063F-1587-4E43-81F1-B948E807363F"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IDevice {
 [PreserveSig]int Activate(ref Guid iid,uint context,IntPtr parameters,[MarshalAs(UnmanagedType.IUnknown)]out object value);
 [PreserveSig]int OpenPropertyStore(uint access,out IPropertyStore store);
 [PreserveSig]int GetId([MarshalAs(UnmanagedType.LPWStr)]out string id); [PreserveSig]int GetState(out uint state);
}
[StructLayout(LayoutKind.Sequential)] struct PropertyKey {public Guid fmtid; public uint pid;}
[StructLayout(LayoutKind.Explicit)] struct Variant { [FieldOffset(0)]public ushort type; [FieldOffset(8)]public IntPtr pointer; }
[ComImport,Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IPropertyStore {
 [PreserveSig]int GetCount(out uint count); [PreserveSig]int GetAt(uint index,out PropertyKey key); [PreserveSig]int GetValue(ref PropertyKey key,out Variant value);
}
[ComImport,Guid("5CDF2C82-841E-4546-9722-0CF74078229A"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IEndpointVolume {
 [PreserveSig]int RegisterControlChangeNotify(IntPtr p); [PreserveSig]int UnregisterControlChangeNotify(IntPtr p);
 [PreserveSig]int GetChannelCount(out uint count); [PreserveSig]int SetMasterVolumeLevel(float v,ref Guid context); [PreserveSig]int SetMasterVolumeLevelScalar(float v,ref Guid context);
 [PreserveSig]int GetMasterVolumeLevel(out float value); [PreserveSig]int GetMasterVolumeLevelScalar(out float value);
 [PreserveSig]int SetChannelVolumeLevel(uint channel,float value,ref Guid context); [PreserveSig]int SetChannelVolumeLevelScalar(uint channel,float value,ref Guid context);
 [PreserveSig]int GetChannelVolumeLevel(uint channel,out float value); [PreserveSig]int GetChannelVolumeLevelScalar(uint channel,out float value);
 [PreserveSig]int SetMute([MarshalAs(UnmanagedType.Bool)]bool mute,ref Guid context); [PreserveSig]int GetMute([MarshalAs(UnmanagedType.Bool)]out bool mute);
}
[ComImport,Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionManager {
 [PreserveSig]int GetAudioSessionControl(ref Guid session,uint flags,[MarshalAs(UnmanagedType.IUnknown)]out object control);
 [PreserveSig]int GetSimpleAudioVolume(ref Guid session,uint flags,[MarshalAs(UnmanagedType.IUnknown)]out object volume);
 [PreserveSig]int GetSessionEnumerator(out ISessionEnumerator value);
}
[ComImport,Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionEnumerator {
 [PreserveSig]int GetCount(out int count); [PreserveSig]int GetSession(int index,[MarshalAs(UnmanagedType.IUnknown)]out object control);
}
[ComImport,Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionControl2 {
 [PreserveSig]int GetState(out int state); [PreserveSig]int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)]out string name);
 [PreserveSig]int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)]string name,ref Guid context);
 [PreserveSig]int GetIconPath([MarshalAs(UnmanagedType.LPWStr)]out string path); [PreserveSig]int SetIconPath([MarshalAs(UnmanagedType.LPWStr)]string path,ref Guid context);
 [PreserveSig]int GetGroupingParam(out Guid grouping); [PreserveSig]int SetGroupingParam(ref Guid grouping,ref Guid context);
 [PreserveSig]int RegisterAudioSessionNotification(IntPtr notify); [PreserveSig]int UnregisterAudioSessionNotification(IntPtr notify);
 [PreserveSig]int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)]out string id); [PreserveSig]int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)]out string id);
 [PreserveSig]int GetProcessId(out uint pid); [PreserveSig]int IsSystemSoundsSession(); [PreserveSig]int SetDuckingPreference([MarshalAs(UnmanagedType.Bool)]bool optOut);
}
[ComImport,Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionVolume {
 [PreserveSig]int SetMasterVolume(float value,ref Guid context); [PreserveSig]int GetMasterVolume(out float value);
 [PreserveSig]int SetMute([MarshalAs(UnmanagedType.Bool)]bool mute,ref Guid context); [PreserveSig]int GetMute([MarshalAs(UnmanagedType.Bool)]out bool mute);
}
[ComImport,Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IMeter {
 [PreserveSig]int GetPeakValue(out float peak);
}
public class Session { public string process; public uint pid; public int state; public bool mute; public float volume; public float peak; public string error; }
public class Endpoint { public string id; public string name; public bool mute; public float volume; public float peak; public List<Session> browserSessions=new List<Session>(); public List<string> errors=new List<string>(); }
public class Result { public string utc=DateTime.UtcNow.ToString("o"); public string method="Read-only Core Audio getters. No volume, mute, endpoint, or session setting is changed."; public Dictionary<string,string> defaults=new Dictionary<string,string>(); public List<Endpoint> endpoints=new List<Endpoint>(); }
public static class Inspect {
 [DllImport("ole32.dll")]static extern int PropVariantClear(ref Variant value);
 static void Check(int code){Marshal.ThrowExceptionForHR(code);}
 static object Activate(IDevice device,Guid iid){object value;Check(device.Activate(ref iid,23,IntPtr.Zero,out value));return value;}
 static string Name(IDevice device){IPropertyStore store;Check(device.OpenPropertyStore(0,out store));try{PropertyKey key=new PropertyKey{fmtid=new Guid("A45C254E-DF1C-4EFD-8020-67D146A850E0"),pid=14};Variant value;Check(store.GetValue(ref key,out value));try{return value.type==31?Marshal.PtrToStringUni(value.pointer):"Unknown endpoint";}finally{PropVariantClear(ref value);}}finally{Marshal.ReleaseComObject(store);}}
 public static Result Read(){
  Result result=new Result();IDeviceEnumerator enumerator=(IDeviceEnumerator)(object)new DeviceEnumeratorCom();
  try{
   string[] roles={"console","multimedia","communications"};
   for(int role=0;role<3;role++){IDevice device;int code=enumerator.GetDefaultAudioEndpoint(0,role,out device);if(code>=0){string id;Check(device.GetId(out id));result.defaults[roles[role]]=id;Marshal.ReleaseComObject(device);}else result.defaults[roles[role]]="Unavailable HRESULT "+code;}
   IDeviceCollection collection;Check(enumerator.EnumAudioEndpoints(0,1,out collection));
   try{uint count;Check(collection.GetCount(out count));for(uint i=0;i<count;i++){
    IDevice device;Check(collection.Item(i,out device));Endpoint endpoint=new Endpoint();
    try{
     string id;Check(device.GetId(out id));endpoint.id=id;endpoint.name=Name(device);
     object volumeObject=Activate(device,typeof(IEndpointVolume).GUID);try{IEndpointVolume volume=(IEndpointVolume)volumeObject;Check(volume.GetMasterVolumeLevelScalar(out endpoint.volume));Check(volume.GetMute(out endpoint.mute));}finally{Marshal.ReleaseComObject(volumeObject);}
     try{object meterObject=Activate(device,typeof(IMeter).GUID);try{Check(((IMeter)meterObject).GetPeakValue(out endpoint.peak));}finally{Marshal.ReleaseComObject(meterObject);}}catch(Exception error){endpoint.errors.Add("Endpoint meter: "+error.Message);}
     object managerObject=Activate(device,typeof(ISessionManager).GUID);try{
      ISessionEnumerator sessions;Check(((ISessionManager)managerObject).GetSessionEnumerator(out sessions));
      try{int sessionCount;Check(sessions.GetCount(out sessionCount));for(int n=0;n<sessionCount;n++){
       object controlObject;Check(sessions.GetSession(n,out controlObject));
       try{ISessionControl2 control=(ISessionControl2)controlObject;uint processId;Check(control.GetProcessId(out processId));string processName;
        try{processName=Process.GetProcessById((int)processId).ProcessName;}catch{continue;}
        string lower=processName.ToLowerInvariant();if(!(lower.Contains("chrome")||lower.Contains("edge")||lower.Contains("firefox")||lower.Contains("chatgpt")||lower.Contains("codex")))continue;
        Session session=new Session{process=processName,pid=processId};Check(control.GetState(out session.state));
        ISessionVolume volume=(ISessionVolume)controlObject;Check(volume.GetMasterVolume(out session.volume));Check(volume.GetMute(out session.mute));
        try{Check(((IMeter)controlObject).GetPeakValue(out session.peak));}catch(Exception error){session.error="Meter: "+error.Message;}
        endpoint.browserSessions.Add(session);
       }catch(Exception error){endpoint.errors.Add("Session read: "+error.Message);}finally{Marshal.ReleaseComObject(controlObject);}
      }}finally{Marshal.ReleaseComObject(sessions);}
     }finally{Marshal.ReleaseComObject(managerObject);}
    }catch(Exception error){endpoint.errors.Add(error.Message);}finally{Marshal.ReleaseComObject(device);}
    result.endpoints.Add(endpoint);
   }}finally{Marshal.ReleaseComObject(collection);}
  }finally{Marshal.ReleaseComObject(enumerator);}
  return result;
 }
}
}
'@
Add-Type -TypeDefinition $source -Language CSharp
$audio = [AssHostAudioRead.Inspect]::Read()
$browserProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe' OR Name = 'msedge.exe' OR Name = 'firefox.exe' OR Name = 'ChatGPT.exe' OR Name = 'Codex.exe'" | ForEach-Object {
  $line = [string]$_.CommandLine
  [PSCustomObject]@{name=$_.Name;pid=$_.ProcessId;parentPid=$_.ParentProcessId;muteAudio=$line.Contains('--mute-audio');headless=$line.Contains('--headless');remoteDebugging=$line.Contains('--remote-debugging');type=if($line -match '--type=([^ ]+)'){$Matches[1]}else{'browser'}}
})
$report = [PSCustomObject]@{audio=$audio;browserProcesses=$browserProcesses;limits='API state and one momentary meter sample do not establish audible physical output. No settings were changed.'}
$destination = [System.IO.Path]::GetFullPath($Output)
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destination)) | Out-Null
$report | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath $destination -Encoding utf8
$report.audio | ConvertTo-Json -Depth 6
$browserProcesses | Group-Object name,muteAudio,headless,type | Select-Object Count,Name | ConvertTo-Json
