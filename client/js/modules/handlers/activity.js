const moment = require('moment');

const Activity = require('../activity.js');

const ActivityHandler = {
  load: async (address) => {
    try {
      const activity = await Activity.getActivity(address);

      const getFileRow = (act, key, text) => {
        let row = null;
        if (act[key] !== undefined) {
          let itemRow = '';
          for (const file of act[key]) {
            itemRow += `<div class="row no-gutters" style="font-size:11px">
                          <div class="col-md-2"></div>
                          <div class="col-md-10">
                            <i class="fas fa-file"></i>&nbsp;
                            ${file.oldFileName}&nbsp;
                            <i>${file.time}</i>
                          </div>
                        </div>`;
          }

          row = `<div class="row no-gutters"  style="font-size:13px">
                  <div class="col-md-3" style="font-size:27px">
                    <i class="fas fa-user-astronaut"></i>
                  </div>
                  <div class="col-md-9">
                    <div class="row">
                      <div class="col">
                        You <b>${text}</b> ${act[key].length > 1 ? 'a few items' : 'an item'}
                      </div>
                    </div>
                    ${itemRow}
                  </div>
                </div>`;
        }

        return row;
      };

      $('#activity-dashboard-display').html('');
      for (const date of Object.keys(activity)) {
        const act = activity[date];

        const deleteRow = getFileRow(act, 'DELETE', 'deleted');
        const renameRow = getFileRow(act, 'RENAME', 'renamed');
        const uploadRow = getFileRow(act, 'UPLOAD', 'uploaded');
        const createRow = getFileRow(act, 'CREATE', 'created');

        const row = `<div class="row" style="border-bottom:1px solid rgb(218,220,224);padding:10px 0;text-align:left;">
                      <div class="col">
                        <div class="row" style="text-align:left;font-size:14px;color:rgba(0,0,0,0.6);margin-bottom:10px">
                          <div class="col">${moment(date).format('MMM D')}</div>
                        </div>
                        ${deleteRow !== null ? '<div class="row"><div class="col">' + deleteRow + '</div></div>' : ''}
                        ${renameRow !== null ? '<div class="row"><div class="col">' + renameRow + '</div></div>' : ''}
                        ${uploadRow !== null ? '<div class="row"><div class="col">' + uploadRow + '</div></div>' : ''}
                        ${createRow !== null ? '<div class="row"><div class="col">' + createRow + '</div></div>' : ''}
                      </div>
                    </div>`;
        $('#activity-dashboard-display').append(row);
      }

      // const el = new SimpleBar($('#activity-dashboard-display')[0]);
      // el.recalculate();
    } catch (err) {
      throw err;
    }
  }
};

module.exports = ActivityHandler;
