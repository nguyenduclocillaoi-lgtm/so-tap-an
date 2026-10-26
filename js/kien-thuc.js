/* Kiến thức: hướng dẫn kỹ thuật từng bài + trang Ghi chú. Thêm kiến thức & tư duy tập gym vào đây. */
'use strict';
const EX_MP={machine_press:'press',flat_db:'press',bb_bench:'press',smith_press:'press',close_grip:'press',incline_db:'incline',incline_machine:'incline',smith_incline:'incline',landmine:'incline',
 push_up:'pushup',dips:'dip',bench_dip:'dip',cable_fly:'fly',hi_lo_fly:'fly',lo_hi_fly:'fly',pec_deck:'fly',rear_deck:'rfly',rear_cable:'rfly',
 db_ohp:'ohp',machine_ohp:'ohp',btn_press:'ohp',cable_lat:'lateral',db_lat:'lateral',machine_lat:'lateral',upright_row:'lateral',y_raise:'yraise',face_pull:'facepull',ext_rot:'extrot',
 lat_pd:'pulldown',one_arm_pd:'pulldown',assist_pu:'pulldown',pull_up:'pulldown',straight_pd:'straight',machine_row:'row',cable_row:'row',cs_db_row:'row',db_row:'row',tbar_row:'row',bent_row:'row',
 db_curl:'curl',hammer:'curl',incline_curl:'curl',cable_curl:'curl',preacher:'curl',pushdown:'pushdown',pushdown_rope:'pushdown',oh_ext:'ohext',skull:'ohext',
 hack:'squat',goblet:'squat',back_squat:'squat',smith_squat:'squat',bss:'squat',lunge:'squat',leg_press:'legpress',rdl:'hinge',deadlift:'hinge',back_ext:'hinge',
 hip_thrust:'thrust',bb_thrust:'thrust',kickback:'kickback',leg_ext:'legext',seated_curl:'legcurl',lying_curl:'legcurl',hip_abd:'abd',hip_add:'add',calf_stand:'calf',calf_seat:'calf',
 cable_crunch:'crunch',leg_tucks:'tuck',hang_knee:'tuck',plank:'plank'};
/* hướng dẫn theo kiểu chuyển động: s chuẩn bị, st các bước, b thở, m [lỗi, cách sửa], tip mẹo HLV, cues lời nhắc ngắn */
const HOW={
 press:{s:'Lưng áp ghế, hai bả vai kéo ra sau và xuống, bàn chân đặt chắc trên sàn.',st:['Hạ tạ có kiểm soát 2–3 giây về ngang giữa ngực.','Dừng khi khuỷu tay ngang thân hoặc thấp hơn một chút; khuỷu tạo góc khoảng 45° với thân.','Đẩy lên dứt khoát, không khóa cứng khuỷu ở đỉnh.'],b:'Hít vào khi hạ, thở ra khi đẩy.',
   m:[['Hạ quá sâu, mặt trước vai bị kéo căng','Dừng khi khuỷu ngang thân, giữ bả vai ép xuống ghế.'],['Nhún vai lên tai','Kéo bả vai xuống và ra sau trước khi bắt đầu set.'],['Mông nhấc khỏi ghế','Đạp chân xuống sàn nhưng giữ mông chạm ghế.']],
   tip:'Chọn độ rộng tay sao cho cẳng tay gần như thẳng đứng ở điểm thấp nhất; tay cầm nằm trên phần gốc lòng bàn tay.',cues:['Siết hai bả vai','Cổ tay trên khuỷu tay','Đẩy cùng lúc hai tay']},
 incline:{s:'Ghế dốc khoảng 30°, bả vai ép xuống ghế, chân chắc trên sàn.',st:['Hạ tạ về ngực trên trong 2–3 giây.','Dừng khi khuỷu ngang thân.','Đẩy lên và hơi chụm vào phía trên ngực trên.'],b:'Hít vào khi hạ, thở ra khi đẩy.',
   m:[['Ghế dốc quá 45°, bài thành đẩy vai','Hạ ghế về 30°, cảm nhận ngực trên làm việc.'],['Khuỷu dang ngang vai 90°','Khép khuỷu về khoảng 45–60° so với thân.']],
   tip:'Cầm tạ đơn lòng bàn tay hướng vào nhau (trung tính) giúp vai đỡ bị kéo căng hơn.',cues:['Ngực ưỡn nhẹ','Khuỷu 45°','Dừng ngang thân']},
 pushup:{s:'Tay rộng hơn vai một chút, thân thẳng từ đầu tới gót.',st:['Hạ ngực trong 2 giây, khuỷu khoảng 45° với thân.','Dừng cách sàn vài cm.','Đẩy lên, giữ bụng và mông siết.'],b:'Hít vào khi xuống, thở ra khi đẩy.',
   m:[['Võng hông','Siết mông và bụng như đang plank.'],['Đầu cúi về trước','Nhìn xuống sàn trước tay khoảng 30 cm.']],tip:'Nếu chưa làm đủ rep, kê tay lên ghế để giảm tải thay vì quỳ gối.',cues:['Thân thẳng','Khuỷu 45°','Ngực chạm gần sàn']},
 dip:{s:'Hai tay chống xà, vai kéo xuống.',st:['Hạ người bằng cách gập khuỷu.','Dừng khi cánh tay song song sàn.','Đẩy lên.'],b:'Hít vào khi xuống, thở ra khi lên.',
   m:[['Hạ quá sâu','Dừng khi cánh tay song song sàn; với vai đang đau thì bỏ bài này.']],tip:'Bài này tải lớn lên mặt trước vai; ưu tiên pushdown hoặc đẩy ngực máy nếu vai còn đau.',cues:['Vai xuống','Ngực hơi nghiêng','Dừng song song']},
 fly:{s:'Ngồi hoặc đứng thẳng, khuỷu hơi cong và giữ nguyên góc suốt động tác.',st:['Mở tay rộng tới khi ngực căng vừa, không đưa tay ra sau thân.','Ép hai tay lại trước ngực theo vòng cung.','Siết ngực 1 giây ở cuối.'],b:'Hít vào khi mở, thở ra khi ép.',
   m:[['Mở tay ra sau thân','Dừng khi tay ngang thân hoặc sớm hơn nếu vai căng.'],['Gập duỗi khuỷu thành động tác đẩy','Khóa góc khuỷu, chỉ chuyển động ở vai.']],tip:'Tưởng tượng đang ôm một cái thùng lớn: tay đi theo vòng cung, không đi thẳng.',cues:['Ôm thùng','Khuỷu cố định','Siết 1 giây']},
 rfly:{s:'Ngồi ngực áp đệm (pec deck ngược) hoặc đứng trước cáp, khuỷu hơi cong.',st:['Mở hai tay ra sau theo vòng cung bằng vai sau.','Dừng khi tay ngang thân.','Về chậm 2 giây.'],b:'Thở ra khi mở tay.',
   m:[['Kéo bằng lưng, ép bả vai quá mạnh','Giữ bả vai yên, để vai sau làm việc.'],['Tạ nặng phải giật','Giảm tạ, làm 12–20 rep chậm.']],tip:'Dẫn động tác bằng mu bàn tay ra hai bên, không phải bằng khuỷu kéo ra sau.',cues:['Bả vai yên','Tay ra hai bên','Về chậm']},
 ohp:{s:'Ngồi lưng tựa ghế, tạ ngang tai.',st:['Đẩy tạ lên qua đầu.','Không khóa khuỷu ở đỉnh.','Hạ về ngang tai.'],b:'Thở ra khi đẩy.',m:[['Ưỡn lưng dưới nhiều','Siết bụng, lưng áp ghế.'],['Hạ ra sau gáy','Hạ phía trước mặt.']],tip:'Với vai đang viêm gân, nên thay bằng nâng vai ngang và đẩy ngực dốc.',cues:['Bụng siết','Đẩy thẳng lên','Không khóa khuỷu']},
 lateral:{s:'Đứng thẳng, tay hơi chếch ra trước thân (mặt phẳng xương vai), khuỷu hơi cong.',st:['Nâng tay sang hai bên bằng vai giữa.','Dừng khi tay ngang vai.','Hạ chậm 2–3 giây.'],b:'Thở ra khi nâng.',
   m:[['Nhún vai, dùng cơ thang','Kéo vai xuống, nâng tới ngang vai là đủ.'],['Lắc người lấy đà','Giảm tạ, hạ chậm.']],tip:'Nghĩ tới việc đẩy tay ra xa thân theo chiều ngang, không phải nhấc lên trên.',cues:['Vai xuống','Ra xa, không lên cao','Hạ 3 giây']},
 yraise:{s:'Đứng hoặc nằm sấp ghế dốc, ngón cái hướng lên.',st:['Nâng tay chéo lên thành chữ Y.','Kéo bả vai xuống trong lúc nâng.','Hạ chậm.'],b:'Thở ra khi nâng.',m:[['Dùng tạ nặng, nhún vai','Dùng tạ rất nhẹ, tập trung kéo bả vai xuống.']],tip:'Bài bảo vệ vai: chất lượng chuyển động quan trọng hơn mức tạ.',cues:['Chữ Y','Bả vai xuống','Tạ nhẹ']},
 facepull:{s:'Dây thừng ngang mặt, đứng vững, ngón cái hướng ra sau.',st:['Kéo dây về phía mặt, tách hai đầu dây.','Khuỷu cao ngang vai, xoay tay ra ngoài ở cuối.','Về chậm.'],b:'Thở ra khi kéo.',m:[['Kéo xuống cằm như row','Giữ khuỷu cao ngang vai.'],['Ngả người lấy đà','Đứng vững, giảm tạ.']],tip:'Kết thúc động tác như tư thế khoe bắp tay hai bên: tay cạnh tai, khuỷu ngang vai.',cues:['Khuỷu cao','Tách dây','Xoay ra ngoài']},
 extrot:{s:'Đứng nghiêng với cáp, khuỷu áp sát hông, gập 90°.',st:['Xoay cẳng tay ra ngoài, giữ khuỷu cố định.','Dừng khi hết biên độ không đau.','Về chậm.'],b:'Thở đều.',m:[['Khuỷu rời khỏi hông','Kẹp một khăn nhỏ giữa khuỷu và hông.']],tip:'Tạ rất nhẹ, 15–20 rep; đây là bài khởi động và bảo vệ khớp vai.',cues:['Khuỷu sát hông','Xoay chậm','Tạ nhẹ']},
 pulldown:{s:'Ngồi kẹp đùi dưới đệm, tay nắm rộng hơn vai.',st:['Kéo bả vai xuống trước.','Kéo thanh về ngực trên, khuỷu hướng xuống sàn.','Duỗi tay lên chậm, cảm nhận xô giãn.'],b:'Thở ra khi kéo xuống.',m:[['Ngả người ra sau nhiều','Chỉ ngả khoảng 10–15°.'],['Kéo bằng tay','Nghĩ tới việc kéo khuỷu xuống túi quần.']],tip:'Kéo khuỷu xuống hướng túi quần sau thay vì kéo tay; xô sẽ làm việc nhiều hơn tay trước.',cues:['Bả vai xuống','Khuỷu vào túi quần','Duỗi chậm']},
 straight:{s:'Đứng trước cáp, hông hơi gập, tay thẳng nắm thanh ngang mặt.',st:['Ép thanh xuống đùi bằng xô, tay giữ thẳng.','Siết xô 1 giây.','Về chậm.'],b:'Thở ra khi kéo xuống.',m:[['Gập khuỷu thành pushdown','Khóa khuỷu hơi cong, chỉ chuyển động ở vai.']],tip:'Bài cô lập xô tốt để khởi động trước buổi kéo.',cues:['Tay thẳng','Ép xuống đùi','Siết xô']},
 row:{s:'Ngồi thẳng lưng, ngực áp đệm nếu máy có, tay duỗi.',st:['Kéo khuỷu về sau sát thân.','Ép hai bả vai lại 1 giây.','Duỗi tay về chậm.'],b:'Thở ra khi kéo.',m:[['Ngả lưng ra sau lấy đà','Giữ thân cố định, giảm tạ.'],['Nhún vai','Kéo bả vai xuống và về sau.']],tip:'Có đệm ngực thì dùng: lưng dưới không phải gồng, ít phải nín thở.',cues:['Ngực áp đệm','Khuỷu ra sau','Ép bả vai']},
 curl:{s:'Đứng thẳng, cánh tay áp thân.',st:['Cuốn tạ lên, giữ khuỷu cố định.','Siết tay trước ở đỉnh.','Hạ chậm 2–3 giây, duỗi gần hết tay.'],b:'Thở ra khi cuốn.',m:[['Lắc người lấy đà','Đứng tựa lưng vào tường để khóa thân.'],['Đưa khuỷu ra trước','Giữ khuỷu cạnh thân.']],tip:'Pha hạ chậm quan trọng ngang pha cuốn lên.',cues:['Khuỷu cố định','Siết đỉnh','Hạ 3 giây']},
 pushdown:{s:'Đứng trước cáp, khuỷu áp sát thân.',st:['Đẩy tay xuống tới khi duỗi thẳng.','Siết tay sau 1 giây.','Về chậm tới khuỷu khoảng 90°.'],b:'Thở ra khi đẩy xuống.',m:[['Khuỷu bay ra trước','Kẹp khuỷu sát hông.'],['Dùng vai, lưng ép xuống','Giảm tạ, chỉ cẳng tay chuyển động.']],tip:'Với dây thừng, tách hai đầu dây ra ở cuối để siết tay sau tốt hơn.',cues:['Khuỷu sát hông','Duỗi hết','Tách dây']},
 ohext:{s:'Đứng hoặc ngồi, cánh tay giơ lên cạnh đầu.',st:['Hạ tạ ra sau đầu bằng cách gập khuỷu.','Giữ cánh tay cố định.','Duỗi thẳng tay lên.'],b:'Thở ra khi duỗi.',m:[['Khuỷu mở rộng ra hai bên','Hướng khuỷu về phía trước.'],['Ưỡn lưng','Siết bụng.']],tip:'Tập trung vào biên độ giãn ở dưới: đây là lợi thế của bài tập qua đầu cho đầu dài tay sau.',cues:['Khuỷu hướng trước','Giãn sâu','Bụng siết']},
 squat:{s:'Chân rộng bằng vai, bụng siết, lưng trung tính.',st:['Đẩy hông ra sau và gập gối, gối theo hướng mũi chân.','Xuống tới khi đùi song song sàn hoặc sâu nhất còn giữ lưng thẳng.','Đạp gót đứng lên.'],b:'Hít vào trước khi xuống, thở ra khi lên; không nín thở lâu.',m:[['Gối chụm vào trong','Đẩy gối ra theo hướng mũi chân.'],['Gót nhấc khỏi sàn','Dồn trọng tâm giữa bàn chân.']],tip:'Hít một hơi vừa phải, siết bụng; thở ra dần khi qua đoạn khó, không nín cả rep.',cues:['Gối theo mũi chân','Lưng thẳng','Đạp gót']},
 legpress:{s:'Lưng và hông áp ghế, chân rộng bằng vai trên bàn đạp.',st:['Hạ bàn đạp tới khi gối khoảng 90°, hông không cuộn khỏi ghế.','Đạp lên bằng cả bàn chân.','Không khóa cứng gối.'],b:'Thở ra khi đạp; không nín thở.',m:[['Hạ quá sâu làm hông cuộn','Dừng khi lưng dưới bắt đầu rời ghế.'],['Khóa gối ở đỉnh','Dừng trước khi gối thẳng hẳn.']],tip:'Đặt chân cao trên bàn đạp thì mông và đùi sau làm nhiều hơn; đặt thấp thì đùi trước làm nhiều hơn.',cues:['Hông áp ghế','Không khóa gối','Thở ra khi đạp']},
 hinge:{s:'Đứng thẳng, tạ sát đùi, gối hơi cong.',st:['Đẩy hông ra sau, lưng thẳng, tạ trượt sát chân.','Dừng khi đùi sau căng (thường ngang giữa ống chân).','Đẩy hông về trước để đứng lên.'],b:'Hít vào khi xuống, thở ra khi lên.',m:[['Cong lưng','Dừng sớm hơn, giữ lưng thẳng.'],['Gập gối thành squat','Gối giữ nguyên góc hơi cong.']],tip:'Tưởng tượng dùng mông đóng cửa xe phía sau: hông đi ra sau, không đi xuống.',cues:['Hông ra sau','Tạ sát chân','Lưng thẳng']},
 thrust:{s:'Lưng trên tựa ghế, bàn chân đặt sao cho ống chân thẳng đứng ở đỉnh.',st:['Đẩy hông lên bằng mông.','Thân thẳng từ vai tới gối ở đỉnh, giữ 1 giây.','Hạ hông chậm.'],b:'Thở ra khi đẩy lên.',m:[['Ưỡn lưng thay vì đẩy hông','Cằm hơi cúi, siết bụng.'],['Đẩy bằng đùi trước','Dịch bàn chân ra xa hơn một chút.']],tip:'Nhìn về phía trước, cằm hơi cúi giúp giữ xương chậu không ưỡn.',cues:['Cằm cúi','Siết mông ở đỉnh','Giữ 1 giây']},
 kickback:{s:'Chống tay vào máy, hông hơi gập, đai cáp ở cổ chân.',st:['Đá chân ra sau bằng mông.','Dừng trước khi ưỡn lưng.','Về chậm.'],b:'Thở ra khi đá.',m:[['Ưỡn lưng dưới','Biên độ ngắn hơn, siết bụng.']],tip:'Hơi nghiêng mũi chân ra ngoài để mông nhỡ tham gia nhiều hơn.',cues:['Bụng siết','Đá ra sau','Về chậm']},
 legext:{s:'Ngồi lưng áp đệm, đệm chân ở cổ chân, trục máy ngang gối.',st:['Duỗi gối nâng chân lên.','Siết đùi trước 1 giây.','Hạ chậm 2–3 giây.'],b:'Thở ra khi duỗi.',m:[['Nhấc hông khỏi ghế','Nắm tay cầm, giữ hông áp ghế.']],tip:'Ngả lưng ra sau một chút giúp cơ thẳng đùi được kéo dài, làm việc nhiều hơn.',cues:['Hông áp ghế','Siết đỉnh','Hạ 3 giây']},
 legcurl:{s:'Đệm đùi giữ chặt, trục máy ngang gối.',st:['Gập gối kéo chân xuống hoặc ra sau.','Siết đùi sau 1 giây.','Về chậm.'],b:'Thở ra khi gập.',m:[['Hông nhấc khỏi ghế','Giảm tạ, giữ hông áp đệm.']],tip:'Bản ngồi kéo dài đùi sau nhiều hơn bản nằm, thường tăng cơ tốt hơn.',cues:['Hông áp đệm','Siết 1 giây','Về chậm']},
 abd:{s:'Ngồi lưng thẳng, đệm ở mặt ngoài gối.',st:['Đẩy gối ra hai bên.','Giữ 1 giây.','Về chậm.'],b:'Thở ra khi đẩy ra.',m:[['Dùng đà bật về','Về chậm, không để tạ chạm nhau.']],tip:'Ngả người về trước một chút thì mông lớn tham gia nhiều hơn.',cues:['Đẩy ra','Giữ 1 giây','Về chậm']},
 add:{s:'Ngồi lưng thẳng, đệm ở mặt trong gối.',st:['Ép gối vào trong.','Giữ 1 giây.','Mở ra chậm.'],b:'Thở ra khi ép.',m:[['Mở quá rộng, căng háng','Chỉ mở tới khi căng vừa.']],tip:'Tập nhẹ ở tuần đầu, cơ khép đùi dễ đau mỏi.',cues:['Ép vào','Giữ 1 giây','Mở chậm']},
 calf:{s:'Đứng mũi chân trên bục, gót thả xuống.',st:['Hạ gót xuống thấp nhất, dừng 1 giây.','Nhón lên cao nhất.','Hạ chậm.'],b:'Thở đều.',m:[['Nhún nhảy, biên độ ngắn','Dừng 1 giây ở dưới để bỏ lực bật.']],tip:'Bắp chân phản ứng tốt với biên độ đầy đủ và dừng ở điểm giãn.',cues:['Dừng ở dưới','Nhón cao nhất','Hạ chậm']},
 crunch:{s:'Quỳ trước cáp, dây thừng cạnh đầu.',st:['Cuộn cột sống xuống, đưa khuỷu về phía đùi.','Hông giữ yên, không ngồi xuống gót.','Về chậm.'],b:'Thở ra khi gập, không nín thở.',m:[['Gập hông thay vì gập cột sống','Giữ hông cố định, cuộn từng đốt sống.']],tip:'Nghĩ tới việc kéo xương ức về phía rốn.',cues:['Hông yên','Cuộn lưng','Thở ra']},
 tuck:{s:'Ngồi mép ghế hoặc treo xà, thân hơi ngả sau.',st:['Co gối về phía ngực.','Cuộn hông nhẹ ở cuối.','Duỗi chân ra chậm.'],b:'Thở ra khi co gối.',m:[['Đung đưa lấy đà','Dừng 1 giây ở mỗi đầu.']],tip:'Cuộn nhẹ xương chậu lên ở cuối mới là phần bụng làm việc nhiều nhất.',cues:['Co gối','Cuộn hông','Duỗi chậm']},
 plank:{s:'Chống cẳng tay, khuỷu dưới vai.',st:['Siết bụng và mông, thân thẳng.','Giữ 20–45 giây.','Thở đều.'],b:'Thở đều, không nín thở.',m:[['Võng hông','Siết mông mạnh hơn.'],['Chổng mông','Hạ hông cho thẳng hàng vai và gót.']],tip:'Có tiền sử trĩ thì giữ ngắn 20–30 giây và thở đều.',cues:['Thân thẳng','Siết mông','Thở đều']}
};
const HOW_EX={
 bss:{s:'Mu bàn chân sau gác lên ghế, chân trước cách ghế khoảng một bước dài, tay cầm tạ đơn hai bên.',st:['Hạ thẳng người xuống, gối sau hướng về sàn.','Dừng khi đùi trước gần song song sàn, gối trước theo mũi chân.','Đạp gót chân trước để đứng lên; làm hết set rồi đổi chân.'],b:'Hít vào khi xuống, thở ra khi lên.',
   m:[['Chân trước quá gần ghế','Lùi chân trước ra xa thêm nửa bước.'],['Dồn lực vào chân sau','Đặt trọng tâm vào gót chân trước.']],tip:'Thân hơi đổ về trước thì mông làm nhiều hơn; thân thẳng thì đùi trước làm nhiều hơn.',cues:['Gót chân trước','Gối sau xuống sàn','Thân vững']},
 lunge:{s:'Đứng thẳng, tay cầm tạ đơn hai bên.',st:['Bước dài về trước, hạ gối sau gần chạm sàn.','Gối trước theo hướng mũi chân.','Đạp chân trước, bước tiếp.'],b:'Thở ra khi đứng lên.',m:[['Bước quá ngắn','Bước dài hơn để gối trước không vượt xa mũi chân.']],tip:'Nhìn thẳng phía trước giúp giữ thăng bằng.',cues:['Bước dài','Gối theo mũi chân','Đạp gót']},
 hack:{s:'Lưng áp đệm, vai dưới đệm vai, chân rộng bằng vai giữa bàn đạp.',st:['Mở khóa, hạ người tới khi đùi song song bàn đạp.','Gối theo hướng mũi chân, lưng không rời đệm.','Đạp cả bàn chân để lên, không khóa gối.'],b:'Hít vào khi xuống, thở ra khi lên; không nín thở lâu.',m:[['Gót nhấc khỏi bàn đạp','Dịch chân lên cao hơn một chút.'],['Hông cuộn khỏi đệm ở đáy','Giảm độ sâu tới khi lưng còn áp đệm.']],tip:'Chân đặt thấp và hẹp thì đùi trước làm việc nhiều nhất.',cues:['Lưng áp đệm','Gối theo mũi chân','Không khóa gối']},
 hammer:{s:'Đứng thẳng, tạ đơn cầm dọc, lòng bàn tay hướng vào nhau.',st:['Cuốn tạ lên, cổ tay trung tính, khuỷu cố định.','Siết ở đỉnh 1 giây.','Hạ chậm 2–3 giây.'],b:'Thở ra khi cuốn.',m:[['Lắc người lấy đà','Giảm tạ, đứng tựa tường.']],tip:'Bài này làm dày phần cẳng tay gần khuỷu và cơ cánh tay nằm dưới tay trước.',cues:['Cầm dọc','Khuỷu cố định','Hạ chậm']},
 incline_curl:{s:'Ngồi ghế dốc 45–60°, tay buông thẳng sau thân.',st:['Cuốn tạ lên, cánh tay giữ nguyên phía sau thân.','Siết ở đỉnh.','Hạ chậm, duỗi gần hết tay.'],b:'Thở ra khi cuốn.',m:[['Đưa khuỷu ra trước','Giữ cánh tay buông thẳng sau thân.']],tip:'Tư thế tay sau thân kéo giãn đầu dài tay trước; dùng tạ nhẹ hơn curl đứng.',cues:['Tay sau thân','Cuốn chậm','Duỗi hết']},
 calf_seat:{s:'Ngồi máy, đệm đặt trên đùi sát gối, mũi chân trên bục.',st:['Hạ gót thấp nhất, dừng 1 giây.','Nhón lên cao nhất.','Hạ chậm.'],b:'Thở đều.',m:[['Biên độ ngắn, nhún nhảy','Dừng 1 giây ở dưới.']],tip:'Ngồi gập gối làm cơ dép (lớp dưới bắp chân) làm việc nhiều hơn bản đứng.',cues:['Dừng ở dưới','Nhón cao','Hạ chậm']},
 back_ext:{s:'Đệm hông ngang xương chậu, gót giữ dưới đệm, tay khoanh trước ngực.',st:['Gập hông hạ thân xuống, lưng giữ thẳng.','Nâng thân lên tới khi thẳng hàng với chân.','Không ưỡn quá thẳng hàng.'],b:'Thở ra khi nâng.',m:[['Ưỡn lưng quá mức ở đỉnh','Dừng khi thân thẳng hàng chân.'],['Giật nhanh','Lên 1 giây, xuống 2 giây.']],tip:'Hơi cuộn lưng trên và siết mông thì mông làm nhiều hơn lưng dưới.',cues:['Thẳng hàng','Siết mông','Không ưỡn']}
};

/* ---------- tab Ghi chú ---------- */
function vNotes(){
  return `
  <h2 class="sec">Ghi chú</h2>
  <section class="card prose">
    <h3>Lưu ý món ăn</h3>
    <ul>
      <li><b>Cân cùng một trạng thái.</b> Thư viện tính theo cân chín, riêng yến mạch cân khô. 100 g gà sống và 100 g gà chín chênh nhau khoảng 30% calo.</li>
      <li><b>Dầu khi chiên, xào là calo ẩn.</b> 1 muỗng canh dầu khoảng 120 kcal. Thêm món "Dầu ăn" vào bữa mỗi khi nấu bằng dầu.</li>
      <li><b>Chất xơ và nước cho người có tiền sử trĩ.</b> Giữ ≥30 g xơ và 2,5–3 L nước mỗi ngày. Tăng xơ dần trong 1–2 tuần để tránh đầy hơi. Tổng quan Cochrane (Alonso-Coello 2005) cho thấy bổ sung chất xơ giảm chảy máu và triệu chứng trĩ.</li>
      <li><b>Nguồn xơ dễ tìm:</b> ổi, thanh long, chuối, rau lá xanh, bông cải, đậu đen, yến mạch, gạo lứt.</li>
      <li><b>Hạn chế muối.</b> WHO khuyến nghị dưới 5 g muối/ngày; nước mắm, nước chấm, mì gói, xúc xích là nguồn muối chính.</li>
      <li><b>Đồ uống có đường</b> (trà sữa, nước ngọt, cà phê sữa) dễ cộng thêm vài trăm kcal mà không no. Ghi vào bữa bằng mục Thực phẩm tự nhập theo nhãn.</li>
      <li><b>Ăn ngoài:</b> tách món thành phần (cơm, thịt, rau, dầu) và nhập từng phần. Sai số vẫn lớn, nên bù bằng theo dõi cân và vòng eo.</li>
      <li><b>Gan và nội tạng</b> rất nhiều vitamin A; tối đa khoảng 1 lần/tuần.</li>
    </ul>
  </section>
  <section class="card prose">
    <h3>Gợi ý nấu nhanh</h3>
    <p class="small muted">Khi nấu bằng dầu, chọn đúng "Cách nấu" cho món trong thực đơn để trang cộng phần dầu (ước tính 3–10 g dầu cho mỗi 100 g món, tùy cách nấu). Khối lượng ghi bên dưới là cân chín.</p>
    <ul>
      <li><b>Ức gà áp chảo (15 phút):</b> đập mỏng ức gà còn ~2 cm, ướp muối, tiêu, tỏi 15 phút. Chảo nóng, quét 1 muỗng cà phê dầu, áp mỗi mặt 4–5 phút lửa vừa, đậy nắp 2 phút cuối. Để nghỉ 3 phút rồi cắt để thịt không khô.</li>
      <li><b>Gà luộc xé, nấu sẵn 3 ngày:</b> luộc 600–700 g ức gà sống với gừng, hành, chút muối; nước sôi thì hạ lửa liu riu 12–15 phút, ngâm thêm 10 phút. Xé sợi, chia hộp 120–150 g, bảo quản ngăn mát tối đa 3–4 ngày.</li>
      <li><b>Cá hấp gừng hành:</b> cá rô phi, diêu hồng hoặc basa, rạch thân, rải gừng sợi, hành, 1 muỗng nước mắm. Hấp 12–15 phút. Không tốn dầu, chọn "Luộc / hấp".</li>
      <li><b>Thịt heo nạc kho ít đường:</b> heo thăn hoặc nạc vai cắt miếng, ướp nước mắm, tiêu, hành tím. Thay đường bằng 1 muỗng cà phê đường hoặc nước dừa tươi, kho lửa nhỏ 25–30 phút. Chọn "Kho / rim"; lưu ý nước kho nhiều muối.</li>
      <li><b>Trứng hấp thịt bằm:</b> 2 trứng + 50 g thịt nạc bằm + nấm mèo, nêm nhẹ, hấp 15–20 phút. Thêm khoảng 10 g protein so với chỉ ăn trứng.</li>
      <li><b>Rau xào ít dầu:</b> phi tỏi với ½–1 muỗng cà phê dầu, cho rau vào lửa lớn, thêm 2–3 muỗng nước thay cho dầu, đảo 2–3 phút. Rau luộc là lựa chọn không tốn dầu.</li>
      <li><b>Bò xào bông cải:</b> bò bắp hoặc thăn thái mỏng, ướp tỏi, tiêu, chút dầu hào; xào nhanh lửa lớn 1–2 phút rồi trút ra, xào bông cải chín tới rồi cho bò vào lại. Chọn "Xào".</li>
      <li><b>Nấu sẵn tinh bột:</b> nấu một nồi cơm hoặc hấp khoai lang cho 2–3 ngày, chia hộp theo khối lượng trong thực đơn. Cơm để nguội trong tủ lạnh rồi hâm lại vẫn giữ nguyên lượng calo.</li>
      <li><b>An toàn thực phẩm:</b> đồ nấu sẵn cho vào tủ lạnh trong vòng 2 giờ sau khi nấu, ăn trong 3–4 ngày, hâm nóng kỹ trước khi ăn.</li>
    </ul>
  </section>
  <section class="card prose">
    <h3>Thực phẩm bổ sung nên chọn</h3>
    <div class="tier"><h3><span class="chip ok">Nên dùng</span></h3><ul>
      <li><b>Creatine monohydrate</b> 3–5 g/ngày, giờ nào cũng được. Bằng chứng mạnh nhất cho sức mạnh và khối cơ (ISSN, Kreider 2017).</li>
      <li><b>Whey protein</b> khi ăn không đủ protein mục tiêu. Đây là thực phẩm tiện lợi, không bắt buộc.</li>
    </ul></div>
    <div class="tier"><h3><span class="chip warn">Tùy trường hợp</span></h3><ul>
      <li><b>Omega-3 (EPA + DHA)</b> nếu ăn cá béo (cá hồi, cá thu, cá nục) dưới 2 bữa/tuần.</li>
      <li><b>Vitamin D3</b> khi xét nghiệm 25(OH)D thấp hoặc ít ra nắng; liều theo bác sĩ.</li>
      <li><b>Caffeine / pre-workout</b> khoảng 3 mg/kg, 30–60 phút trước tập. Kiểm tra lượng caffeine trên nhãn, tránh dùng sau 14h nếu khó ngủ.</li>
      <li><b>Vỏ hạt mã đề (psyllium)</b> khi không ăn đủ 30 g xơ; uống kèm nhiều nước.</li>
      <li><b>Magie</b> khi ăn ít rau xanh, hạt, đậu. Ưu tiên bổ sung qua thực phẩm trước.</li>
    </ul></div>
    <div class="tier"><h3><span class="chip bad">Không cần hoặc nên tránh</span></h3><ul>
      <li><b>BCAA / EAA</b> khi đã ăn đủ protein mỗi ngày.</li>
      <li><b>Thuốc đốt mỡ (fat burner), "testosterone booster"</b>: bằng chứng yếu, rủi ro về tim mạch và gan.</li>
      <li><b>Vitamin C, E hoặc NAC liều cao quanh giờ tập</b>: có thể làm giảm thích nghi với tập luyện (Paulsen 2014).</li>
      <li><b>Ashwagandha (KSM-66)</b>: có báo cáo tổn thương gan; độ an toàn khi dùng lâu dài chưa kiểm chứng được.</li>
    </ul></div>
  </section>
  <section class="card">
    <h3>Vi chất cần chú ý</h3>
    <p class="small muted">Nhu cầu cho nam 19–30 tuổi theo NIH Office of Dietary Supplements (RDA, hoặc AI khi ghi rõ). Ăn đủ nhóm thực phẩm thì phần lớn không cần uống thêm.</p>
    <div class="scroll"><table class="tbl"><thead><tr><th>Vi chất</th><th class="r">Nhu cầu/ngày</th><th>Vai trò</th><th>Nguồn thực phẩm</th></tr></thead><tbody>
      <tr><td>Kẽm</td><td class="r">11 mg</td><td>Miễn dịch, tổng hợp protein</td><td>Hàu, thịt bò, hạt bí, trứng</td></tr>
      <tr><td>Magie</td><td class="r">400 mg</td><td>Co cơ, thần kinh, giấc ngủ</td><td>Rau lá xanh, hạt, đậu đen, yến mạch</td></tr>
      <tr><td>Sắt</td><td class="r">8 mg</td><td>Vận chuyển oxy</td><td>Thịt đỏ, gan, đậu; ăn kèm vitamin C</td></tr>
      <tr><td>Canxi</td><td class="r">1.000 mg</td><td>Xương, co cơ</td><td>Sữa, sữa chua, đậu hũ, cá nhỏ ăn cả xương</td></tr>
      <tr><td>Kali</td><td class="r">3.400 mg (AI)</td><td>Cân bằng điện giải, huyết áp</td><td>Chuối, khoai lang, rau lá, đậu</td></tr>
      <tr><td>Natri</td><td class="r">&lt; 2.000 mg (WHO)</td><td>Điện giải; dư gây tăng huyết áp</td><td>Hạn chế nước mắm, mì gói, đồ chế biến</td></tr>
      <tr><td>Vitamin D</td><td class="r">15 µg (600 IU)</td><td>Xương, chức năng cơ</td><td>Nắng, cá béo, lòng đỏ trứng</td></tr>
      <tr><td>Vitamin B12</td><td class="r">2,4 µg</td><td>Tạo máu, thần kinh</td><td>Thịt, cá, trứng, sữa</td></tr>
      <tr><td>Vitamin C</td><td class="r">90 mg</td><td>Collagen, miễn dịch, hấp thu sắt</td><td>Ổi (100 g đã vượt nhu cầu), cam, rau xanh</td></tr>
      <tr><td>Chất xơ</td><td class="r">38 g (AI)</td><td>Tiêu hóa, ngừa táo bón</td><td>Rau, trái cây, đậu, yến mạch, gạo lứt</td></tr>
      <tr><td>Omega-3 (ALA)</td><td class="r">1,6 g (AI)</td><td>Tim mạch; EPA/DHA chưa có RDA</td><td>Cá béo 2 bữa/tuần, hạt lanh, óc chó</td></tr>
    </tbody></table></div>
  </section>
  <section class="card">
    <h3>Tên nhóm cơ (song ngữ)</h3>
    <div class="scroll"><table class="tbl"><thead><tr><th>Tên trong trang</th><th>Tên tiếng Anh</th><th>Vị trí</th></tr></thead><tbody>
      <tr><td>Ngực trên / giữa / dưới</td><td>Pectoralis major (phần đòn / phần ức)</td><td>Ngực</td></tr>
      <tr><td>Vai trước / giữa / sau</td><td>Anterior / lateral / posterior deltoid</td><td>Đầu vai</td></tr>
      <tr><td>Chóp xoay</td><td>Rotator cuff (infraspinatus, teres minor…)</td><td>Quanh khớp vai, giữ ổn định</td></tr>
      <tr><td>Xô</td><td>Latissimus dorsi</td><td>Hai bên lưng, tạo lưng chữ V</td></tr>
      <tr><td>Lưng giữa</td><td>Rhomboids, middle trapezius</td><td>Giữa hai bả vai</td></tr>
      <tr><td>Cơ thang</td><td>Trapezius</td><td>Cổ, vai, lưng trên</td></tr>
      <tr><td>Cơ tròn lớn</td><td>Teres major</td><td>Dưới nách, cạnh xô</td></tr>
      <tr><td>Cơ dựng sống</td><td>Erector spinae</td><td>Dọc hai bên cột sống</td></tr>
      <tr><td>Tay trước</td><td>Biceps brachii (đầu dài, đầu ngắn)</td><td>Mặt trước cánh tay</td></tr>
      <tr><td>Cơ cánh tay / cánh tay quay</td><td>Brachialis / brachioradialis</td><td>Dưới tay trước / cẳng tay gần khuỷu</td></tr>
      <tr><td>Tay sau</td><td>Triceps brachii (đầu dài, ngoài, trong)</td><td>Mặt sau cánh tay</td></tr>
      <tr><td>Đùi trước, cơ thẳng đùi</td><td>Quadriceps, rectus femoris</td><td>Mặt trước đùi</td></tr>
      <tr><td>Đùi sau</td><td>Hamstrings</td><td>Mặt sau đùi</td></tr>
      <tr><td>Mông / mông nhỡ, mông bé</td><td>Gluteus maximus / medius, minimus</td><td>Mông / hông bên</td></tr>
      <tr><td>Cơ khép đùi</td><td>Adductors</td><td>Mặt trong đùi</td></tr>
      <tr><td>Cơ bụng chân / cơ dép</td><td>Gastrocnemius / soleus</td><td>Bắp chân</td></tr>
      <tr><td>Cơ thẳng bụng / chéo bụng / ngang bụng</td><td>Rectus abdominis / obliques / transversus abdominis</td><td>Bụng</td></tr>
      <tr><td>Cơ gập hông</td><td>Hip flexors (iliopsoas)</td><td>Trước khớp hông</td></tr>
    </tbody></table></div>
  </section>
  <section class="card prose">
    <h3>Lưu ý khi tập</h3>
    <ul>
      <li><b>Vai:</b> khi đẩy ngực, dừng lúc khuỷu tay ngang thân. Đau ≤3/10 và sáng hôm sau không đau hơn thì chấp nhận được (mượn từ mô hình theo dõi đau cho gân gót, chưa kiểm chứng được riêng cho vai). Đau tăng dần thì dừng bài đó và đi khám.</li>
      <li><b>Trĩ:</b> thở ra ở pha đẩy/kéo, không nín thở quá 1 rep; bài compound giữ RIR 2. Ra máu hoặc sa búi sau buổi tập thì giảm tạ và đi khám.</li>
      <li><b>Độ gắng sức:</b> dừng set khi còn 1–2 rep nữa là kiệt sức (RIR 1–2). Tuần 1–2 RIR 3, tuần 8 giảm một nửa số set (deload).</li>
      <li><b>Tăng tạ kép (double progression):</b> khi mọi set đạt mức rep cao nhất của khoảng, tuần sau tăng tạ 2,5–5%. Mục "Ghi buổi tập" tự gợi ý việc này.</li>
    </ul>
  </section>
  <section class="card prose">
    <h3>Nguồn tham khảo</h3>
    <ul class="small">
      <li><a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener">USDA FoodData Central</a> – số liệu dinh dưỡng thực phẩm.</li>
      <li><a href="https://ods.od.nih.gov/factsheets/list-all/" target="_blank" rel="noopener">NIH Office of Dietary Supplements</a> – nhu cầu vi chất.</li>
      <li><a href="https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z" target="_blank" rel="noopener">Kreider và cộng sự 2017, ISSN position stand về creatine</a>.</li>
      <li><a href="https://bjsm.bmj.com/content/52/6/376" target="_blank" rel="noopener">Morton và cộng sự 2018, BJSM</a> – protein và tăng cơ.</li>
      <li><a href="https://pacompendium.com/" target="_blank" rel="noopener">Compendium of Physical Activities</a> – giá trị MET.</li>
      <li><a href="https://exercisedb.dev/" target="_blank" rel="noopener">ExerciseDB</a> (qua dự án openGym, giấy phép MIT, © Hasan Emir Yıldırım) – tên, nhóm cơ và các bước của 159 bài tập bổ sung, đã dịch sang tiếng Việt.</li>
      <li><a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (phạm vi công cộng) – ảnh minh hoạ hai tư thế của 175 bài.</li>
      <li>Schoenfeld và cộng sự 2017, Journal of Sports Sciences – số set mỗi tuần.</li>
      <li>Alonso-Coello và cộng sự 2005, Cochrane – chất xơ và trĩ.</li>
      <li>Paulsen và cộng sự 2014, Journal of Physiology – vitamin C/E và thích nghi tập luyện.</li>
    </ul>
    <p class="small muted">Trang này hỗ trợ lập kế hoạch, không thay cho chẩn đoán hay chỉ định của bác sĩ.</p>
  </section>`;
}
